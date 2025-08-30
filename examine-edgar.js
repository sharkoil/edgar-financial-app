// Check SEC EDGAR data structure
async function examineEDGARData() {
    try {
        console.log('Fetching AAPL company facts...');
        const response = await fetch('/api/sec/companyfacts/CIK0000320193.json');
        const data = await response.json();
        
        console.log('\n=== EDGAR Company Facts Structure ===');
        console.log('Available top-level keys:', Object.keys(data));
        
        console.log('\n=== Entity Information ===');
        console.log('Entity Name:', data.entityName);
        console.log('CIK:', data.cik);
        console.log('SIC:', data.sic);
        console.log('SIC Description:', data.sicDescription);
        console.log('Entity Type:', data.entityType);
        console.log('Category:', data.category);
        console.log('Fiscal Year End:', data.fiscalYearEnd);
        console.log('State of Incorporation:', data.stateOfIncorporation);
        
        console.log('\n=== Facts Structure ===');
        if (data.facts) {
            console.log('Facts sections:', Object.keys(data.facts));
            
            if (data.facts['us-gaap']) {
                console.log('US-GAAP metrics count:', Object.keys(data.facts['us-gaap']).length);
                console.log('Sample US-GAAP metrics:', Object.keys(data.facts['us-gaap']).slice(0, 10));
            }
            
            if (data.facts['dei']) {
                console.log('DEI (Document Entity Information) metrics:', Object.keys(data.facts['dei']));
            }
        }
        
        console.log('\n=== Company Overview Fields Check ===');
        // Check if common overview fields exist
        const overviewFields = [
            'BusinessDescription',
            'CompanyDescription', 
            'EntityCommonStockSharesOutstanding',
            'EntityPublicFloat',
            'NumberOfEmployees',
            'RevenueFromContractWithCustomerExcludingAssessedTax'
        ];
        
        overviewFields.forEach(field => {
            const exists = data.facts?.['us-gaap']?.[field] || data.facts?.['dei']?.[field];
            console.log(`${field}: ${exists ? '✓ Available' : '✗ Not found'}`);
        });
        
    } catch (error) {
        console.error('Error examining EDGAR data:', error);
    }
}

// Run when page loads
document.addEventListener('DOMContentLoaded', examineEDGARData);
