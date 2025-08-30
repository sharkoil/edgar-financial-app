# SEC EDGAR Financial Lookup App

## 📋 Project Requirements

### Application Overview
A simple 2-page financial lookup app with ChatGPT-inspired interface design for SEC EDGAR financial data retrieval and analysis.

### Page 1: Home Page (ChatGPT-style Interface)

#### Design Requirements
- **UI Style**: Clean, minimal interface inspired by ChatGPT
- **Layout**: Centered search interface with simple, elegant design
- **Branding**: Professional appearance suitable for financial data lookup

#### Search Functionality
- **Input Field**: Single search box for company symbols or names
- **Type-ahead Feature**: 
  - Real-time search as user types
  - Data source: `https://www.sec.gov/files/company_tickers.json` (13,000+ companies)
  - Search both ticker symbols (e.g., "AAPL") and company names (e.g., "Apple Inc.")
  - Display matching suggestions in dropdown format
  - User can click to select a company from suggestions
- **Submit Action**: When user hits submit/enter, navigate to results page passing selected company's CIK

#### Technical Implementation
- **Frontend**: HTML, CSS, JavaScript
- **Data Fetching**: JavaScript fetch API to get company tickers JSON
- **Search Algorithm**: Filter companies by ticker and name matching user input
- **Navigation**: Pass CIK parameter to results page

### Page 2: Dynamic Financial Report Page

#### Data Processing
- **Data Source**: SEC EDGAR API endpoint `https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json`
- **Dynamic Generation**: Page content is completely dynamic based on JSON response parsing
- **Live Data**: Fresh financial data pulled directly from SEC servers
- **⚠️ DATA FILTERING**: **Only display current calendar year (2025) financial data**

#### JSON Parsing Requirements
- **Input**: Massive JSON response (hundreds of KB) containing 15+ years of financial data
- **Parser Function**: Build intelligent parser to extract key financial metrics from complex SEC JSON structure
- **Data Filtering**: **Filter data to only include 2025 calendar year entries**
- **Data Organization**: Group 2025 metrics by financial statement categories:
  - **Balance Sheet**: Assets, liabilities, equity (current year only)
  - **Income Statement**: Revenue, expenses, profitability (current year only)
  - **Cash Flow**: Operating, investing, financing activities (current year only)
  - **Key Ratios**: Calculate important financial ratios from 2025 raw data only

#### HTML Report Generation
- **Dynamic HTML**: Generate HTML financial report from parsed 2025 JSON data
- **Output Format**: Plain HTML presentation (no fancy charts/graphics needed)
- **Content Structure**: Organized financial information with clear sections for current year
- **Current Year Focus**: **Display only 2025 financial data** (no historical trends)

### Complete User Flow
1. **Landing**: User arrives at ChatGPT-style home page
2. **Search**: User types company name/symbol → sees real-time type-ahead suggestions
3. **Selection**: User selects company from dropdown → hits submit
4. **Processing**: App fetches live financial JSON data using company's CIK from SEC API
5. **Filtering**: App filters massive JSON response to extract **only 2025 financial data**
6. **Parsing**: App intelligently parses filtered JSON to extract current year financial metrics
7. **Generation**: App dynamically builds HTML financial report from 2025 data only
8. **Display**: User sees **current year (2025) financial report** with latest SEC data

### Technical Architecture
- **Frontend Only**: Pure HTML/CSS/JavaScript solution (no backend required)
- **API Dependencies**: 
  - SEC Company Tickers JSON for search functionality
  - SEC EDGAR Company Facts API for financial data
- **Core Technologies**: Vanilla JavaScript, Fetch API, JSON parsing, Dynamic HTML generation
- **Data Filtering**: Efficient filtering of large JSON to current calendar year only
- **Performance**: Handle large JSON responses efficiently while filtering to current year
- **Reliability**: Robust error handling for API and parsing failures

### Key Features Summary
- ✅ ChatGPT-inspired clean UI design
- ✅ Real-time company search with type-ahead (13,000+ companies)
- ✅ SEC EDGAR integration for live financial data
- ✅ **Dynamic JSON-to-HTML financial report generator**
- ✅ **Current year (2025) financial data only** - no historical data
- ✅ Focused, current financial analysis from latest SEC filings
- ✅ Simple, fast, no-database solution
- ✅ Professional current-year financial reporting capability

### Core Innovation
Transform complex SEC EDGAR JSON data into readable **current year financial reports** through intelligent parsing, date filtering, and dynamic HTML generation.

### Key Constraint
**Only display 2025 calendar year financial data** - filter out all historical information.

## 🚀 Getting Started

1. Open `index.html` in a web browser
2. Search for any public company
3. View their 2025 financial data

## 📁 Project Structure

```
/
├── README.md
├── index.html          # Home page with search
├── report.html         # Financial report page
├── data/
│   └── companies.json  # Cached company data for faster search
├── css/
│   └── style.css       # ChatGPT-inspired styling
└── js/
    ├── search.js       # Company search functionality
    ├── financial.js    # Financial data parsing
    └── report.js       # Report generation
```
