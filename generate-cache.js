// Generate cached company data for faster search
console.log('📦 Generating company cache...');

async function generateCompanyCache() {
  try {
    const response = await fetch('https://www.sec.gov/files/company_tickers.json');
    const tickers = await response.json();
    
    // Convert to searchable array format
    const companies = Object.values(tickers).map(company => ({
      cik: company.cik_str.toString().padStart(10, '0'),
      ticker: company.ticker,
      name: company.title
    }));
    
    console.log(`✅ Processed ${companies.length} companies`);
    
    // Save to file
    const fs = require('fs');
    fs.writeFileSync('./data/companies.json', JSON.stringify(companies, null, 2));
    
    console.log('💾 Saved companies.json');
    
    // Show sample
    console.log('Sample companies:');
    companies.slice(0, 5).forEach(c => 
      console.log(`  ${c.ticker}: ${c.name} (CIK: ${c.cik})`)
    );
    
  } catch (error) {
    console.error('❌ Failed to generate cache:', error);
  }
}

generateCompanyCache();
