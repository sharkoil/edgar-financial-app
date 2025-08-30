// SEC API Test Script
console.log('🔍 Testing SEC APIs...');

// Test 1: Company Tickers
async function testAPIs() {
  try {
    console.log('Fetching company tickers...');
    const tickersResponse = await fetch('https://www.sec.gov/files/company_tickers.json');
    const tickers = await tickersResponse.json();
    
    console.log(`✅ Found ${Object.keys(tickers).length} companies`);
    
    // Find Apple
    const apple = Object.values(tickers).find(c => c.ticker === 'AAPL');
    console.log('🍎 Apple found:', apple);
    
    // Test 2: Financial Data
    const paddedCik = apple.cik_str.toString().padStart(10, '0');
    const financialUrl = `https://data.sec.gov/api/xbrl/companyfacts/CIK${paddedCik}.json`;
    
    console.log('Fetching financial data...');
    const financialResponse = await fetch(financialUrl);
    const financialData = await financialResponse.json();
    
    console.log(`✅ Financial data for: ${financialData.entityName}`);
    
    // Check for 2025 data
    const facts = financialData.facts['us-gaap'];
    if (facts.Assets && facts.Assets.units && facts.Assets.units.USD) {
      const assets2025 = facts.Assets.units.USD.filter(entry => 
        entry.fy === 2025 || (entry.end && entry.end.includes('2025'))
      );
      console.log(`📊 Found ${assets2025.length} asset entries for 2025`);
      if (assets2025.length > 0) {
        console.log('Latest 2025 data:', assets2025[assets2025.length - 1]);
      }
    }
    
    console.log('🎉 All tests passed!');
    return { tickers, financialData };
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testAPIs();
