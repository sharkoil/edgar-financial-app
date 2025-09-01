# SEC EDGAR Financial Analysis Platform - Technical Specification

## 📐 **SYSTEM ARCHITECTURE**

### **Architecture Pattern**: Client-Server with API Gateway
```
[Browser Client] ↔ [Node.js Proxy Server] ↔ [External APIs]
     │                    │                      │
     │                    │                      ├─ SEC EDGAR API
     │                    │                      ├─ Alpha Vantage API  
     │                    │                      ├─ Serper News API
     │                    │                      └─ OpenRouter LLM API
     │                    │
     └─ Static Assets ────┘
```

## 🔧 **COMPONENT SPECIFICATIONS**

### **1. Proxy Server (proxy-server.js)**

**Purpose**: CORS-enabled API gateway and static file server

**Technical Details**:
- **Runtime**: Node.js HTTP server
- **Port**: 8080
- **Request Handling**: HTTP/1.1 with keep-alive
- **CORS Headers**: `Access-Control-Allow-Origin: *`

**API Routing**:
```javascript
/api/sec/*           → data.sec.gov/api/xbrl/*
/api/alphavantage/*  → www.alphavantage.co/query?*
Static files         → Local file system
```

**Key Functions**:
- `serveFile(res, filePath)` - Static asset delivery
- `proxySecRequest(res, apiPath)` - SEC EDGAR API proxy
- `proxyAlphaVantageRequest(res, queryParams)` - Alpha Vantage proxy

### **2. Financial Data Processor (js/financial.js)**

**Purpose**: SEC EDGAR JSON parsing and financial metrics extraction

**Class**: `FinancialDataProcessor`

**Key Methods**:
```javascript
async fetchCompanyFinancials(cik)     // Fetch SEC data via proxy
processFinancialData(data)            // Parse and filter 2025 data
extractBalanceSheetData(facts)        // Balance sheet metrics
extractIncomeStatementData(facts)     // P&L metrics  
extractCashFlowData(facts)            // Cash flow metrics
calculateKeyMetrics(facts)            // Derived ratios
```

**Data Filtering Logic**:
- Filter to 2025 calendar year entries only
- Handle quarterly and annual reporting periods
- Prioritize 10-K annual filings over 10-Q quarterly
- Extract most recent available values

### **3. Search Engine (js/search.js)**

**Purpose**: Real-time company search with type-ahead

**Class**: `CompanySearchEngine`

**Key Features**:
- **Dataset**: 13,000+ public company records
- **Search Algorithm**: Fuzzy matching on ticker and company name
- **Performance**: Debounced search with 200ms delay
- **Result Limit**: Maximum 10 suggestions per query

**Data Structure**:
```javascript
{
  cik: "0000320193",
  ticker: "AAPL", 
  name: "Apple Inc."
}
```

### **4. Stock Chart Component (js/stock-chart.js)**

**Purpose**: Interactive stock price visualization

**Class**: `StockChart`

**Technical Specifications**:
- **Library**: Chart.js 4.4.0 with UMD distribution
- **Chart Type**: Line chart with time-series X-axis
- **Constraints**: 300px max height, 2000 max Y-axis value
- **Data Source**: Alpha Vantage TIME_SERIES_DAILY
- **Responsive**: Full container width with aspect ratio management

**Configuration**:
```javascript
chartConfig = {
  type: 'line',
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { max: this.options.maxYValue || 2000 }
    }
  }
}
```

### **5. AI Financial Analyst (js/llm-analyst.js)**

**Purpose**: Professional financial analysis generation

**Class**: `LLMFinancialAnalyst`

**AI Configuration**:
- **Provider**: OpenRouter API
- **Model**: `deepseek/deepseek-r1-0528:free`
- **Persona**: Marcus Rothschild, CFA (30-year Wall Street veteran)
- **Output**: 300-500 word professional analysis

**Analysis Framework**:
1. Financial Health Assessment
2. Growth Analysis  
3. Balance Sheet Strength
4. Competitive Position
5. Management Effectiveness
6. Valuation Perspective
7. Risk Factor Analysis

### **6. News Service (js/news.js)**

**Purpose**: Company news aggregation and display

**Class**: `NewsService`

**Features**:
- **Provider**: Serper API for news search
- **Caching**: 5-minute client-side cache
- **Article Count**: 5 articles per company
- **Metadata**: Title, source, date, snippet, link

## 📊 **DATA FLOW SPECIFICATIONS**

### **1. Search Workflow**
```mermaid
User Input → Debounce (200ms) → Filter Companies → Display Results
```

### **2. Report Generation Workflow**
```mermaid
CIK Parameter → SEC API Call → JSON Parsing → 2025 Filtering → 
Financial Metrics → Chart Loading → AI Analysis → News Loading → 
Complete Report Display
```

### **3. Error Handling Chain**
```mermaid
API Call → Network Check → Response Validation → Data Parsing → 
Error State Display (if any step fails)
```

## 🔐 **SECURITY SPECIFICATIONS**

### **API Key Management**
- **Storage**: Embedded in client-side JavaScript (development approach)
- **Rotation**: Manual key rotation when needed
- **Rate Limiting**: Client-side throttling to respect API limits

### **CORS Configuration**
```javascript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}
```

## 📈 **PERFORMANCE SPECIFICATIONS**

### **Client-Side Optimization**
- **JSON Processing**: Streaming parsing for large SEC responses
- **Memory Management**: Garbage collection after data processing
- **Chart Rendering**: Canvas optimization with data point limiting
- **Search Performance**: Index-based lookup with binary search

### **Server-Side Optimization**
- **HTTP Keep-Alive**: Persistent connections to external APIs
- **Response Compression**: Gzip compression for large JSON responses
- **Caching Headers**: Appropriate cache-control for static assets

### **Load Time Targets**
- **Initial Page Load**: < 2 seconds
- **Search Results**: < 500ms
- **Financial Report**: < 5 seconds (including all components)
- **Chart Rendering**: < 2 seconds

## 🌐 **API INTEGRATION SPECIFICATIONS**

### **1. SEC EDGAR API**
```
Base URL: https://data.sec.gov/api/xbrl/
Endpoints:
  - /companyfacts/CIK{cik}.json (Company financial data)
  - /company_tickers.json (Company directory)

Headers:
  User-Agent: Financial Lookup App (contact@example.com)
  Accept: application/json

Rate Limits: 10 requests per second per IP
Response Size: 100KB - 1MB JSON
```

### **2. Alpha Vantage API**
```
Base URL: https://www.alphavantage.co/query
Function: TIME_SERIES_DAILY
Parameters:
  - symbol: Stock ticker
  - outputsize: compact
  - apikey: WNZ9Z35IUAUASVMV

Rate Limits: 5 requests per minute (free tier)
Response Size: ~50KB JSON
```

### **3. Serper News API**
```
Base URL: https://google.serper.dev/search
Method: POST
Headers:
  X-API-KEY: b9719d19dcda85be1faa543b42b5a0a106529e63
  Content-Type: application/json

Body:
  {
    "q": "company name news",
    "type": "news", 
    "num": 5
  }

Rate Limits: 2500 requests per month
```

### **4. OpenRouter LLM API**
```
Base URL: https://openrouter.ai/api/v1/chat/completions
Method: POST
Headers:
  Authorization: Bearer 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
  Content-Type: application/json

Model: deepseek/deepseek-r1-0528:free
Max Tokens: 1000
Temperature: 0.7
```

## 🎨 **UI/UX SPECIFICATIONS**

### **Design System**
- **Theme**: Dark mode inspired by ChatGPT
- **Color Palette**:
  - Primary: #10a37f (Green accent)
  - Background: #1a1a1a (Dark background)
  - Text: #e0e0e0 (Light text)
  - Secondary: #333 (Borders and dividers)

### **Typography**
- **Font Family**: -apple-system, BlinkMacSystemFont, "Segoe UI"
- **Font Sizes**: 
  - Headers: 1.5em - 2em
  - Body: 0.9em - 1em
  - Captions: 0.8em - 0.85em

### **Component Specifications**

#### **Search Interface**
- **Input Field**: Full-width with placeholder text
- **Dropdown**: Maximum 10 results with hover states
- **Loading State**: Spinner with "Searching..." text

#### **Financial Tables**
- **Layout**: Responsive table with sticky headers
- **Data Formatting**: Currency formatting with locale support
- **Alternating Rows**: Subtle background color differences

#### **Chart Container**
- **Dimensions**: 100% width, 300px max height
- **Responsive**: Maintains aspect ratio on resize
- **Loading State**: Skeleton loader with animation

## 🧪 **TESTING SPECIFICATIONS**

### **Unit Testing Requirements**
- **Financial Parser**: Test 2025 data filtering accuracy
- **Search Engine**: Verify fuzzy matching algorithms
- **Chart Component**: Test responsive behavior
- **API Services**: Mock API responses and error handling

### **Integration Testing Requirements**
- **End-to-End Flow**: Complete user journey testing
- **API Integration**: Real API calls with rate limiting
- **Cross-Browser**: Chrome, Firefox, Safari, Edge testing
- **Performance**: Load testing with large datasets

### **Test Data Requirements**
- **Sample Companies**: AAPL, MSFT, GOOGL for consistent testing
- **Mock Responses**: Saved SEC JSON responses for offline testing
- **Error Scenarios**: Network failures, API errors, malformed data

## 📱 **BROWSER COMPATIBILITY**

### **Minimum Requirements**
- **Chrome**: 90+ (Canvas support, ES6+ features)
- **Firefox**: 88+ (Chart.js compatibility)
- **Safari**: 14+ (Fetch API support)
- **Edge**: 90+ (Modern JavaScript support)

### **JavaScript Features Required**
- ES6+ (Classes, async/await, arrow functions)
- Fetch API (Network requests)
- Canvas API (Chart rendering)
- Local Storage (Configuration caching)

## 🚀 **DEPLOYMENT SPECIFICATIONS**

### **Development Environment**
```bash
Node.js: 18+ LTS
Port: 8080
Process: Single-threaded HTTP server
Memory: ~50MB base, ~200MB with large JSON processing
```

### **Production Considerations**
- **Process Management**: PM2 or similar for server restart
- **Logging**: Console logging with timestamp
- **Monitoring**: Basic health check endpoint
- **Backup**: Source code version control

### **Environment Variables**
```bash
# Optional overrides (defaults in code)
PORT=8080
SEC_API_BASE=https://data.sec.gov/api/xbrl
ALPHAVANTAGE_API_KEY=WNZ9Z35IUAUASVMV
```

---

**Document Version**: 1.0  
**Last Updated**: September 1, 2025  
**Technical Review**: Required for major architecture changes
