// Test table rendering
console.log('Testing table structure...');

// Simulate some test data
const testIncomeStatement = {
    'Total Revenue': {
        value: 365800000000,
        date: '2024-09-28',
        formatted: '$365.80B'
    },
    'Net Income': {
        value: 93736000000,
        date: '2024-09-28', 
        formatted: '$93.74B'
    },
    'Operating Income': {
        value: 114301000000,
        date: '2024-09-28',
        formatted: '$114.30B'
    }
};

// Test the table generation
const tableRows = Object.entries(testIncomeStatement)
    .map(([label, data]) => {
        if (!data) return '';
        return `
            <tr>
                <td class="metric-label">${label}</td>
                <td class="metric-value">${data.formatted}</td>
                <td class="metric-date">${data.date}</td>
            </tr>
        `;
    })
    .filter(row => row)
    .join('');

const tableHTML = `
    <div class="financial-section">
        <h2 class="section-title">Income Statement</h2>
        <div class="table-container">
            <table class="financial-table">
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Amount (2025)</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    </div>
`;

console.log('Generated table HTML:');
console.log(tableHTML);
