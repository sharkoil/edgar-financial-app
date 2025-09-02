# Company Research Tool 🔬

A powerful command-line tool that researches any public company from our EDGAR database using **Firecrawl**, **OpenRouter AI**, and **Serper APIs**.

## 🚀 Features

- **🏢 Company Database**: Search across 10,090+ public companies from SEC EDGAR
- **🔍 Google Search**: Automated search using Serper API
- **🤖 AI URL Selection**: OpenRouter DeepSeek R1 model intelligently selects relevant sources
- **🔥 Web Extraction**: Firecrawl extracts structured data from web pages
- **📊 Structured Results**: Professional JSON-formatted research reports
- **💾 File Export**: Automatically saves results with timestamps

## 🔧 API Configuration

The tool uses these pre-configured API keys:
- **Firecrawl**: `fc-704acb6ef204410ca1414c078b393197`
- **OpenRouter**: `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`
- **Serper**: `b9719d19dcda85be1faa543b42b5a0a106529e63`

## 📖 Usage

### Interactive Mode
```bash
python company-researcher.py
```

### Command Line Mode
```bash
# Research specific company and objective
python company-researcher.py --company "Apple" --objective "financial performance 2024"

# Use ticker symbols
python company-researcher.py --company "NVDA" --objective "AI chip market share"

# Research without saving to file
python company-researcher.py --company "Microsoft" --objective "cloud revenue growth" --no-save
```

### Command Line Options
- `--company, -c`: Company name or ticker symbol to research
- `--objective, -o`: Research objective (what information to gather)
- `--no-save`: Do not save results to file

## 📋 Examples

### Recent Test Results

**Apple Inc. (AAPL) - Q4 2024 Earnings:**
```json
{
  "year": 2024,
  "ticker": "AAPL",
  "company": "Apple Inc.",
  "quarter": "Q4",
  "keyFacts": [
    "Quarterly revenue of $94.9 billion, up 6 percent year over year.",
    "Quarterly diluted earnings per share of $0.97, up 12 percent year over year",
    "Record business performance drove nearly $27 billion in operating cash flow"
  ],
  "financialData": {
    "revenue": 94900000000,
    "earningsPerShare": 0.97
  }
}
```

**NVIDIA Corp (NVDA) - Recent Acquisitions:**
```json
{
  "ticker": "NVDA",
  "recentAcquisitions": [
    {
      "acquisitionName": "Gretel",
      "acquisitionDate": "2025-03-19",
      "acquisitionValue": 320000000,
      "businessMetrics": {"employeeCount": 82}
    },
    {
      "acquisitionName": "Arm Limited",
      "acquisitionDate": "2020-09-13", 
      "acquisitionValue": 40000000000
    },
    {
      "acquisitionName": "Mellanox Technologies",
      "acquisitionDate": "2020-04-27",
      "acquisitionValue": 6900000000
    }
  ]
}
```

## 📁 Output

Results are automatically saved to `research_results/` directory:
- **Filename Format**: `{TICKER}_{TIMESTAMP}.txt`
- **Example**: `NVDA_20250901_220612.txt`
- **Content**: Formatted report with company details, research objective, and extracted data

## 🔍 Company Search

The tool supports flexible company searching:

### By Ticker Symbol
```bash
AAPL → Apple Inc.
NVDA → NVIDIA CORP  
MSFT → Microsoft Corp
TSLA → Tesla Inc
GOOGL → Alphabet Inc.
```

### By Company Name
```bash
"Apple" → Apple Inc.
"Microsoft" → Microsoft Corp
"Tesla" → Tesla Inc
"Alphabet" → Alphabet Inc.
```

### Fuzzy Matching
The tool uses intelligent matching to find companies even with partial names or common abbreviations.

## 📊 Research Objectives

### Financial Research
- "quarterly earnings Q4 2024"
- "annual revenue growth"
- "profit margins analysis"
- "cash flow performance"

### Business Analysis  
- "recent acquisitions"
- "market share analysis"
- "competitive positioning"
- "product launches 2024"

### Industry Focus
- "AI chip market share" (for tech companies)
- "cloud revenue growth" (for service providers)
- "sustainability initiatives" (for any industry)

## 🛠️ Technical Details

### Dependencies
```bash
pip install -r research-requirements.txt
```

Required packages:
- `requests>=2.31.0` - HTTP requests for API calls
- `pathlib>=1.0.1` - File path handling
- `argparse` - Command line argument parsing

### Architecture
1. **Company Lookup**: Searches local EDGAR companies database
2. **Google Search**: Uses Serper API to find relevant web sources  
3. **URL Selection**: AI analyzes search results to pick best sources
4. **Data Extraction**: Firecrawl scrapes and structures information
5. **Result Processing**: Formats and saves comprehensive reports

### Error Handling
- Graceful fallback when AI URL selection fails
- Retry logic for API timeouts
- Comprehensive error messages with colored output
- Automatic fallback to top search results

## 🎨 Output Formatting

The tool uses colored terminal output:
- 🔵 **Blue**: User prompts and headers
- 🟡 **Yellow**: Processing status and warnings  
- 🟢 **Green**: Success messages and results
- 🔴 **Red**: Error messages
- 🟣 **Magenta**: Special notifications
- 🔅 **Cyan**: Information highlights

## 📈 Performance

- **Database**: 10,090+ public companies loaded in memory
- **Search Speed**: ~2-3 seconds for Google search
- **Extraction Time**: 30-120 seconds depending on content complexity
- **Result Quality**: High-quality structured data with source citations

## 🚨 Limitations

- AI URL selection may fail if OpenRouter API is unavailable (graceful fallback implemented)
- Firecrawl extraction time varies based on content complexity
- Rate limits apply to all external APIs
- Results quality depends on available web sources

## 💡 Tips

1. **Be Specific**: More detailed research objectives yield better results
2. **Use Official Names**: Search using official company names or exact ticker symbols
3. **Check Sources**: Review the source URLs in results for credibility
4. **Save Results**: Important research is automatically saved with timestamps
5. **Iterate**: Try different research objectives for comprehensive analysis

This tool transforms complex company research into a simple command-line experience! 🎯
