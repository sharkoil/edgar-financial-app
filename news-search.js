const readline = require('readline');
const fs = require('fs');

// Create readline interface for console input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Load company tickers data
let companyData = {
  'AAPL': { name: 'Apple Inc.', cik: '320193' },
  'MSFT': { name: 'Microsoft Corporation', cik: '789019' },
  'GOOGL': { name: 'Alphabet Inc.', cik: '1652044' },
  'AMZN': { name: 'Amazon.com Inc.', cik: '1018724' },
  'TSLA': { name: 'Tesla Inc.', cik: '1318605' },
  'META': { name: 'Meta Platforms Inc.', cik: '1326801' },
  'NVDA': { name: 'NVIDIA Corporation', cik: '1045810' },
  'JPM': { name: 'JPMorgan Chase & Co.', cik: '19617' },
  'JNJ': { name: 'Johnson & Johnson', cik: '200406' },
  'V': { name: 'Visa Inc.', cik: '1403161' },
  'PG': { name: 'Procter & Gamble Company', cik: '80424' },
  'HD': { name: 'Home Depot Inc.', cik: '354950' },
  'MA': { name: 'Mastercard Incorporated', cik: '1141391' },
  'DIS': { name: 'Walt Disney Company', cik: '1001039' },
  'NFLX': { name: 'Netflix Inc.', cik: '1065280' }
};

// Load the company tickers from the cached file or use defaults
function loadCompanyData() {
  try {
    if (fs.existsSync('./data/company_tickers.json')) {
      const data = fs.readFileSync('./data/company_tickers.json', 'utf8');
      const parsed = JSON.parse(data);
      
      // Convert to a more searchable format
      companyData = {};
      for (const [key, company] of Object.entries(parsed)) {
        const ticker = company.ticker?.toUpperCase();
        if (ticker) {
          companyData[ticker] = {
            name: company.title,
            cik: company.cik_str
          };
        }
      }
      console.log(`📊 Loaded ${Object.keys(companyData).length} companies from file`);
    } else {
      console.log(`📊 Using default company data (${Object.keys(companyData).length} companies)`);
    }
  } catch (error) {
    console.error('Error loading company data:', error.message);
    console.log(`📊 Using default company data (${Object.keys(companyData).length} companies)`);
  }
}

// Search for news using Serper API
async function searchNews(companyName) {
  const myHeaders = new Headers();
  myHeaders.append("X-API-KEY", "b9719d19dcda85be1faa543b42b5a0a106529e63");
  myHeaders.append("Content-Type", "application/json");

  const raw = JSON.stringify({
    "q": companyName,
    "type": "news",
    "num": 10
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: raw,
    redirect: "follow"
  };

  try {
    console.log(`🔍 Searching news for: ${companyName}`);
    const response = await fetch("https://google.serper.dev/search", requestOptions);
    const result = await response.json();
    
    if (result.news && result.news.length > 0) {
      console.log(`\n📰 Found ${result.news.length} news articles:\n`);
      
      result.news.forEach((article, index) => {
        console.log(`${index + 1}. ${article.title}`);
        console.log(`   Source: ${article.source} | Date: ${article.date}`);
        console.log(`   Link: ${article.link}`);
        if (article.snippet) {
          console.log(`   Preview: ${article.snippet}`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No news articles found');
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error searching news:', error.message);
    return null;
  }
}

// Find company by ticker
function findCompany(ticker) {
  const upperTicker = ticker.toUpperCase();
  return companyData[upperTicker];
}

// Main function to handle user input
async function handleTickerInput() {
  rl.question('🎯 Enter a ticker symbol (or "exit" to quit): ', async (ticker) => {
    if (ticker.toLowerCase() === 'exit') {
      console.log('👋 Goodbye!');
      rl.close();
      return;
    }

    const company = findCompany(ticker);
    if (company) {
      console.log(`✅ Found company: ${company.name} (${ticker.toUpperCase()})`);
      await searchNews(company.name);
    } else {
      console.log(`❌ Company not found for ticker: ${ticker.toUpperCase()}`);
      console.log('💡 Try tickers like: AAPL, MSFT, GOOGL, TSLA, AMZN');
    }

    console.log('\n' + '='.repeat(80) + '\n');
    handleTickerInput(); // Ask for next ticker
  });
}

// Initialize the news search tool
async function init() {
  console.log('🚀 Company News Search Tool');
  console.log('===========================\n');
  
  // Load company data
  loadCompanyData();
  
  console.log('💡 This tool will search for news articles about public companies');
  console.log('💡 Enter a ticker symbol to get the latest news');
  console.log('💡 Available tickers: AAPL, MSFT, GOOGL, AMZN, TSLA, META, NVDA, JPM, JNJ, V, PG, HD, MA, DIS, NFLX\n');
  
  // Start the input loop
  handleTickerInput();
}

// Start the application
init();
