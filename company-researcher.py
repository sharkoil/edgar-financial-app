#!/usr/bin/env python3
"""
Company Research Tool using Firecrawl, OpenRouter, and Serper APIs
Based on the DeepSeek V3 Company Researcher example from Firecrawl

This tool researches any public company from our companies.json database using:
- Serper API for Google search results
- OpenRouter (DeepSeek R1) for intelligent URL selection 
- Firecrawl for structured data extraction from web pages
"""

import os
import json
import time
import random
import requests
import argparse
from typing import List, Dict, Any, Optional
from pathlib import Path

# ANSI color codes for terminal output
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

# API Configuration (hardcoded as per requirements)
FIRECRAWL_API_KEY = "fc-704acb6ef204410ca1414c078b393197"
OPENROUTER_API_KEY = "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"
SERPER_API_KEY = "b9719d19dcda85be1faa543b42b5a0a106529e63"

class CompanyResearcher:
    def __init__(self):
        self.companies_data = self.load_companies_data()
        self.session = requests.Session()
        
    def load_companies_data(self) -> List[Dict[str, str]]:
        """Load companies data from our local JSON file"""
        companies_file = Path("data/companies.json")
        if not companies_file.exists():
            print(f"{Colors.RED}Error: companies.json not found in data/ directory{Colors.RESET}")
            return []
            
        try:
            with open(companies_file, 'r', encoding='utf-8') as f:
                companies = json.load(f)
            print(f"{Colors.GREEN}Loaded {len(companies):,} companies from database{Colors.RESET}")
            return companies
        except Exception as e:
            print(f"{Colors.RED}Error loading companies data: {e}{Colors.RESET}")
            return []
    
    def search_company(self, query: str) -> Optional[Dict[str, str]]:
        """Search for a company in our database"""
        query_lower = query.lower()
        
        # Try exact ticker match first
        for company in self.companies_data:
            if company.get('ticker', '').lower() == query_lower:
                return company
        
        # Try partial name match
        for company in self.companies_data:
            name = company.get('name', '').lower()
            if query_lower in name or name.startswith(query_lower):
                return company
        
        # Try fuzzy matching
        matches = []
        for company in self.companies_data:
            name = company.get('name', '').lower()
            ticker = company.get('ticker', '').lower()
            
            # Score based on how well the query matches
            score = 0
            if query_lower in name:
                score += 10
            if query_lower in ticker:
                score += 15
            if name.startswith(query_lower):
                score += 5
            if ticker.startswith(query_lower):
                score += 8
                
            # Word-level matching
            query_words = query_lower.split()
            name_words = name.split()
            for q_word in query_words:
                for n_word in name_words:
                    if q_word in n_word:
                        score += 3
                        
            if score > 0:
                matches.append((company, score))
        
        if matches:
            # Sort by score and return best match
            matches.sort(key=lambda x: x[1], reverse=True)
            return matches[0][0]
        
        return None
    
    def search_google(self, query: str) -> List[Dict[str, Any]]:
        """Search Google using Serper API"""
        print(f"{Colors.YELLOW}🔍 Searching Google for '{query}'...{Colors.RESET}")
        
        headers = {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json'
        }
        
        payload = {
            'q': query,
            'num': 10,
            'gl': 'us',
            'hl': 'en'
        }
        
        try:
            response = self.session.post(
                'https://google.serper.dev/search',
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            results = data.get('organic', [])
            
            print(f"{Colors.GREEN}✅ Found {len(results)} search results{Colors.RESET}")
            return results
            
        except Exception as e:
            print(f"{Colors.RED}❌ Google search failed: {e}{Colors.RESET}")
            return []
    
    def select_urls_with_ai(self, company: Dict[str, str], objective: str, search_results: List[Dict[str, Any]]) -> List[str]:
        """Use OpenRouter AI to select the most relevant URLs"""
        print(f"{Colors.YELLOW}🤖 Using AI to select relevant URLs...{Colors.RESET}")
        
        # Prepare search results data for AI analysis
        serp_data = []
        for result in search_results[:10]:  # Limit to top 10 results
            serp_data.append({
                'title': result.get('title', ''),
                'link': result.get('link', ''),
                'snippet': result.get('snippet', '')
            })
        
        headers = {
            'Authorization': f'Bearer {OPENROUTER_API_KEY}',
            'Content-Type': 'application/json'
        }
        
        prompt = (
            f"You are a research assistant tasked with selecting the most relevant URLs for gathering information about {company['name']} ({company.get('ticker', 'N/A')}).\n\n"
            f"Research Objective: {objective}\n\n"
            f"Available Search Results: {json.dumps(serp_data, indent=2)}\n\n"
            f"Instructions:\n"
            f"1. Select 3-5 URLs that are most likely to contain information relevant to the research objective\n"
            f"2. Prioritize official company websites, investor relations pages, and reputable financial news sources\n"
            f"3. Avoid social media, forums, and unreliable sources\n"
            f"4. Return ONLY a JSON object with this exact format: {{\"selected_urls\": [\"url1\", \"url2\", \"url3\"]}}\n"
            f"5. Do not include any explanation or additional text\n\n"
            f"Response must be valid JSON only:"
        )
        
        payload = {
            'model': 'deepseek/deepseek-r1-distill-llama-70b',
            'messages': [
                {
                    'role': 'system',
                    'content': 'You are a URL selection assistant. Return only valid JSON objects.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'max_tokens': 500,
            'temperature': 0.1
        }
        
        try:
            response = self.session.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers=headers,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            
            data = response.json()
            ai_response = data['choices'][0]['message']['content'].strip()
            
            # Clean and parse JSON response
            if ai_response.startswith('```'):
                ai_response = ai_response.split('```')[1]
                if ai_response.startswith('json'):
                    ai_response = ai_response[4:]
                ai_response = ai_response.strip()
            
            try:
                result = json.loads(ai_response)
                selected_urls = result.get('selected_urls', [])
                
                if selected_urls:
                    print(f"{Colors.CYAN}📋 AI selected {len(selected_urls)} URLs:{Colors.RESET}")
                    for i, url in enumerate(selected_urls, 1):
                        print(f"{Colors.CYAN}   {i}. {url}{Colors.RESET}")
                    return selected_urls
                else:
                    print(f"{Colors.YELLOW}⚠️  AI didn't return URLs, using top search results{Colors.RESET}")
                    return [result['link'] for result in search_results[:3]]
                    
            except json.JSONDecodeError:
                print(f"{Colors.YELLOW}⚠️  Failed to parse AI response, using top search results{Colors.RESET}")
                return [result['link'] for result in search_results[:3]]
                
        except Exception as e:
            print(f"{Colors.RED}❌ AI URL selection failed: {e}{Colors.RESET}")
            print(f"{Colors.YELLOW}📋 Falling back to top search results{Colors.RESET}")
            return [result['link'] for result in search_results[:3]]
    
    def extract_company_info(self, urls: List[str], objective: str, company: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Use Firecrawl to extract structured data from selected URLs"""
        print(f"{Colors.YELLOW}🔥 Extracting data using Firecrawl...{Colors.RESET}")
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {FIRECRAWL_API_KEY}'
        }
        
        enhanced_prompt = (
            f"Extract comprehensive information about {company['name']} ({company.get('ticker', 'N/A')}) "
            f"focusing specifically on: {objective}.\n\n"
            f"Requirements:\n"
            f"1. Extract only factual information that is explicitly stated in the sources\n"
            f"2. Focus on the specific research objective: {objective}\n"
            f"3. Include financial data, business metrics, and key facts when available\n"
            f"4. Organize the information in a clear, structured format\n"
            f"5. Cite the source URL for each piece of information\n"
            f"6. If conflicting information exists, note the discrepancies\n\n"
            f"Format the response as structured JSON with clear categories relevant to the research objective."
        )
        
        payload = {
            'urls': urls,
            'prompt': enhanced_prompt,
            'enableWebSearch': False,
            'allowExternalLinks': True,
            'showSources': True
        }
        
        try:
            print(f"{Colors.YELLOW}🚀 Starting extraction job...{Colors.RESET}")
            response = self.session.post(
                'https://api.firecrawl.dev/v1/extract',
                headers=headers,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            
            data = response.json()
            
            if not data.get('success'):
                print(f"{Colors.RED}❌ Firecrawl API error: {data.get('error', 'Unknown error')}{Colors.RESET}")
                return None
            
            extraction_id = data.get('id')
            if not extraction_id:
                print(f"{Colors.RED}❌ No extraction ID received{Colors.RESET}")
                return None
            
            print(f"{Colors.YELLOW}⏳ Polling for results (ID: {extraction_id})...{Colors.RESET}")
            return self.poll_extraction_result(extraction_id)
            
        except Exception as e:
            print(f"{Colors.RED}❌ Extraction failed: {e}{Colors.RESET}")
            return None
    
    def poll_extraction_result(self, extraction_id: str, max_attempts: int = 60, interval: int = 5) -> Optional[Dict[str, Any]]:
        """Poll Firecrawl API for extraction results"""
        url = f"https://api.firecrawl.dev/v1/extract/{extraction_id}"
        headers = {'Authorization': f'Bearer {FIRECRAWL_API_KEY}'}
        
        for attempt in range(1, max_attempts + 1):
            try:
                response = self.session.get(url, headers=headers, timeout=30)
                response.raise_for_status()
                data = response.json()
                
                if data.get('success') and data.get('data'):
                    print(f"{Colors.GREEN}✅ Extraction completed successfully!{Colors.RESET}")
                    return data['data']
                    
                elif data.get('success') and not data.get('data'):
                    if attempt % 6 == 0:  # Show progress every 30 seconds
                        print(f"{Colors.YELLOW}⏳ Still processing... (attempt {attempt}/{max_attempts}){Colors.RESET}")
                    time.sleep(interval)
                    
                else:
                    print(f"{Colors.RED}❌ API error: {data.get('error', 'Unknown error')}{Colors.RESET}")
                    return None
                    
            except Exception as e:
                print(f"{Colors.RED}❌ Polling error: {e}{Colors.RESET}")
                time.sleep(interval)
                continue
        
        print(f"{Colors.RED}❌ Extraction timed out after {max_attempts * interval} seconds{Colors.RESET}")
        return None
    
    def format_results(self, data: Dict[str, Any], company: Dict[str, str], objective: str) -> str:
        """Format the extracted data for display"""
        output = []
        output.append(f"{Colors.BOLD}{Colors.GREEN}{'='*80}{Colors.RESET}")
        output.append(f"{Colors.BOLD}{Colors.GREEN}COMPANY RESEARCH RESULTS{Colors.RESET}")
        output.append(f"{Colors.BOLD}{Colors.GREEN}{'='*80}{Colors.RESET}")
        output.append("")
        output.append(f"{Colors.BOLD}Company:{Colors.RESET} {company['name']} ({company.get('ticker', 'N/A')})")
        output.append(f"{Colors.BOLD}CIK:{Colors.RESET} {company.get('cik', 'N/A')}")
        output.append(f"{Colors.BOLD}Research Objective:{Colors.RESET} {objective}")
        output.append(f"{Colors.BOLD}Timestamp:{Colors.RESET} {time.strftime('%Y-%m-%d %H:%M:%S')}")
        output.append("")
        output.append(f"{Colors.BOLD}{Colors.CYAN}EXTRACTED INFORMATION:{Colors.RESET}")
        output.append(f"{Colors.CYAN}{'-'*40}{Colors.RESET}")
        
        # Format the extracted data nicely
        if isinstance(data, dict):
            output.append(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            output.append(str(data))
        
        output.append("")
        output.append(f"{Colors.BOLD}{Colors.GREEN}{'='*80}{Colors.RESET}")
        
        return "\n".join(output)
    
    def save_results(self, results: str, company: Dict[str, str], objective: str):
        """Save research results to a file"""
        # Create results directory if it doesn't exist
        results_dir = Path("research_results")
        results_dir.mkdir(exist_ok=True)
        
        # Generate filename
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        ticker = company.get('ticker', 'UNKNOWN').replace('/', '_')
        filename = f"{ticker}_{timestamp}.txt"
        filepath = results_dir / filename
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(results)
            print(f"{Colors.GREEN}💾 Results saved to: {filepath}{Colors.RESET}")
        except Exception as e:
            print(f"{Colors.RED}❌ Failed to save results: {e}{Colors.RESET}")
    
    def research_company(self, company_query: str, research_objective: str, save_to_file: bool = True) -> bool:
        """Main research workflow"""
        print(f"{Colors.BOLD}{Colors.BLUE}🔬 COMPANY RESEARCH TOOL{Colors.RESET}")
        print(f"{Colors.BLUE}{'='*50}{Colors.RESET}")
        
        # 1. Find company in our database
        print(f"{Colors.YELLOW}🔍 Searching for company: '{company_query}'...{Colors.RESET}")
        company = self.search_company(company_query)
        
        if not company:
            print(f"{Colors.RED}❌ Company not found in database{Colors.RESET}")
            print(f"{Colors.YELLOW}💡 Try searching by ticker symbol (e.g., 'AAPL') or company name{Colors.RESET}")
            return False
        
        print(f"{Colors.GREEN}✅ Found company: {company['name']} ({company.get('ticker', 'N/A')}){Colors.RESET}")
        print()
        
        # 2. Search Google for company information
        search_query = f"{company['name']} {research_objective}"
        search_results = self.search_google(search_query)
        
        if not search_results:
            print(f"{Colors.RED}❌ No search results found{Colors.RESET}")
            return False
        
        # 3. Select relevant URLs using AI
        selected_urls = self.select_urls_with_ai(company, research_objective, search_results)
        
        if not selected_urls:
            print(f"{Colors.RED}❌ No URLs selected for extraction{Colors.RESET}")
            return False
        
        # 4. Extract information using Firecrawl
        extracted_data = self.extract_company_info(selected_urls, research_objective, company)
        
        if not extracted_data:
            print(f"{Colors.RED}❌ Failed to extract information{Colors.RESET}")
            return False
        
        # 5. Format and display results
        formatted_results = self.format_results(extracted_data, company, research_objective)
        print(formatted_results)
        
        # 6. Save results to file
        if save_to_file:
            self.save_results(formatted_results, company, research_objective)
        
        return True

def main():
    parser = argparse.ArgumentParser(
        description='Research public companies using Firecrawl, OpenRouter AI, and Serper APIs',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python company-researcher.py                                    # Interactive mode
  python company-researcher.py --company "Apple" --objective "financial performance 2024"
  python company-researcher.py --company "NVDA" --objective "AI chip market share"
  python company-researcher.py --company "Microsoft" --objective "cloud revenue growth" --no-save
        """
    )
    
    parser.add_argument('--company', '-c', 
                       help='Company name or ticker symbol to research')
    parser.add_argument('--objective', '-o', 
                       help='Research objective (what information to gather)')
    parser.add_argument('--no-save', action='store_true',
                       help='Do not save results to file')
    
    args = parser.parse_args()
    
    try:
        researcher = CompanyResearcher()
        
        if not researcher.companies_data:
            print(f"{Colors.RED}❌ Cannot proceed without companies data{Colors.RESET}")
            return 1
        
        # Interactive mode if no arguments provided
        if not args.company or not args.objective:
            print(f"{Colors.BOLD}{Colors.CYAN}🔬 INTERACTIVE COMPANY RESEARCH TOOL{Colors.RESET}")
            print(f"{Colors.CYAN}{'='*60}{Colors.RESET}")
            print(f"{Colors.WHITE}Research any of {len(researcher.companies_data):,} public companies in our database{Colors.RESET}")
            print()
            
            if not args.company:
                print(f"{Colors.YELLOW}💡 You can search by company name or ticker symbol{Colors.RESET}")
                print(f"{Colors.YELLOW}   Examples: 'Apple', 'AAPL', 'Microsoft', 'Tesla', 'NVDA'{Colors.RESET}")
                company_query = input(f"{Colors.BLUE}Enter company name or ticker: {Colors.RESET}").strip()
            else:
                company_query = args.company
            
            if not args.objective:
                print(f"{Colors.YELLOW}💡 Be specific about what information you want to research{Colors.RESET}")
                print(f"{Colors.YELLOW}   Examples: 'quarterly earnings 2024', 'market share analysis', 'recent acquisitions'{Colors.RESET}")
                research_objective = input(f"{Colors.BLUE}Enter research objective: {Colors.RESET}").strip()
            else:
                research_objective = args.objective
        else:
            company_query = args.company
            research_objective = args.objective
        
        if not company_query or not research_objective:
            print(f"{Colors.RED}❌ Both company and research objective are required{Colors.RESET}")
            return 1
        
        # Perform research
        success = researcher.research_company(
            company_query, 
            research_objective, 
            save_to_file=not args.no_save
        )
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}👋 Research interrupted by user{Colors.RESET}")
        return 1
    except Exception as e:
        print(f"{Colors.RED}❌ Unexpected error: {e}{Colors.RESET}")
        return 1

if __name__ == "__main__":
    exit(main())
