// Debug script to see raw SEC data structure
const https = require('https');

function fetchAppleData() {
    const options = {
        hostname: 'data.sec.gov',
        path: '/api/xbrl/companyfacts/CIK0000320193.json',
        method: 'GET',
        headers: {
            'User-Agent': 'Financial Lookup App (contact@example.com)',
            'Accept': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            const jsonData = JSON.parse(data);
            
            console.log('🏢 Company:', jsonData.entityName);
            console.log('📊 Available fact categories:');
            console.log(Object.keys(jsonData.facts));
            
            console.log('\n📈 US-GAAP facts available:');
            const usGaap = jsonData.facts['us-gaap'];
            const factKeys = Object.keys(usGaap).slice(0, 20); // First 20 for brevity
            factKeys.forEach(key => {
                console.log(`  - ${key}`);
            });
            
            console.log(`\n📏 Total US-GAAP facts: ${Object.keys(usGaap).length}`);
            
            // Check what's available for Assets
            if (usGaap.Assets) {
                console.log('\n💰 Assets data structure:');
                console.log('  Units available:', Object.keys(usGaap.Assets.units));
                
                if (usGaap.Assets.units.USD) {
                    const usdEntries = usGaap.Assets.units.USD;
                    console.log(`  USD entries: ${usdEntries.length}`);
                    
                    // Show 2025 entries
                    const entries2025 = usdEntries.filter(entry => 
                        entry.fy === 2025 || (entry.end && entry.end.includes('2025'))
                    );
                    console.log(`  2025 entries: ${entries2025.length}`);
                    
                    if (entries2025.length > 0) {
                        console.log('  Sample 2025 entry:', JSON.stringify(entries2025[0], null, 2));
                    }
                }
            }
        });
    });

    req.on('error', (err) => {
        console.error('Error:', err);
    });

    req.end();
}

fetchAppleData();
