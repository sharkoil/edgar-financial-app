// Financial Data Processing and Parsing
class FinancialDataProcessor {
    constructor() {
        this.currentYear = 2025;
    }

    async fetchCompanyFinancials(cik) {
        try {
            // Use proxy endpoint to avoid CORS issues
            const response = await fetch(`/api/sec/companyfacts/CIK${cik}.json`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch financial data:', error);
            throw error;
        }
    }

    processFinancialData(data) {
        const facts = data.facts['us-gaap'] || {};
        const result = {
            company: {
                name: data.entityName,
                cik: data.cik
            },
            balanceSheet: this.extractBalanceSheetData(facts),
            incomeStatement: this.extractIncomeStatementData(facts),
            cashFlow: this.extractCashFlowData(facts),
            keyMetrics: this.calculateKeyMetrics(facts)
        };

        return result;
    }

    extractBalanceSheetData(facts) {
        const metrics = {
            'Total Assets': 'Assets',
            'Current Assets': 'AssetsCurrent',
            'Cash and Cash Equivalents': 'CashAndCashEquivalentsAtCarryingValue',
            'Total Liabilities': 'Liabilities',
            'Current Liabilities': 'LiabilitiesCurrent',
            'Stockholders Equity': 'StockholdersEquity',
            'Property Plant Equipment': 'PropertyPlantAndEquipmentNet'
        };

        return this.extractMetrics(facts, metrics);
    }

    extractIncomeStatementData(facts) {
        const metrics = {
            'Total Revenue': 'Revenues',
            'Net Sales': 'RevenueFromContractWithCustomerExcludingAssessedTax',
            'Cost of Revenue': 'CostOfGoodsAndServicesSold',
            'Gross Profit': 'GrossProfit',
            'Operating Income': 'OperatingIncomeLoss',
            'Net Income': 'NetIncomeLoss',
            'Earnings Per Share (Basic)': 'EarningsPerShareBasic',
            'Earnings Per Share (Diluted)': 'EarningsPerShareDiluted'
        };

        return this.extractMetrics(facts, metrics);
    }

    extractCashFlowData(facts) {
        const metrics = {
            'Operating Cash Flow': 'NetCashProvidedByUsedInOperatingActivities',
            'Investing Cash Flow': 'NetCashProvidedByUsedInInvestingActivities',
            'Financing Cash Flow': 'NetCashProvidedByUsedInFinancingActivities',
            'Capital Expenditures': 'PaymentsToAcquirePropertyPlantAndEquipment'
        };

        const result = this.extractMetrics(facts, metrics);
        
        // Calculate Free Cash Flow = Operating Cash Flow - Capital Expenditures
        if (result['Operating Cash Flow'] && result['Capital Expenditures']) {
            const operatingCF = result['Operating Cash Flow'].value;
            const capex = Math.abs(result['Capital Expenditures'].value); // Make positive for calculation
            
            result['Free Cash Flow'] = {
                value: operatingCF - capex,
                date: result['Operating Cash Flow'].date,
                formatted: this.formatCurrency(operatingCF - capex)
            };
        }

        return result;
    }

    calculateKeyMetrics(facts) {
        const assets = this.getLatestValue(facts, 'Assets');
        const revenue = this.getLatestValue(facts, 'Revenues');
        const netIncome = this.getLatestValue(facts, 'NetIncomeLoss');
        const equity = this.getLatestValue(facts, 'StockholdersEquity');
        const shares = this.getLatestValue(facts, 'CommonStockSharesOutstanding');

        const metrics = {};

        if (assets && revenue) {
            metrics['Asset Turnover'] = {
                value: (revenue.val / assets.val).toFixed(2),
                date: revenue.end,
                formatted: `${(revenue.val / assets.val).toFixed(2)}x`
            };
        }

        if (netIncome && equity) {
            metrics['Return on Equity'] = {
                value: ((netIncome.val / equity.val) * 100).toFixed(2),
                date: netIncome.end,
                formatted: `${((netIncome.val / equity.val) * 100).toFixed(2)}%`
            };
        }

        if (netIncome && assets) {
            metrics['Return on Assets'] = {
                value: ((netIncome.val / assets.val) * 100).toFixed(2),
                date: netIncome.end,
                formatted: `${((netIncome.val / assets.val) * 100).toFixed(2)}%`
            };
        }

        if (netIncome && revenue) {
            metrics['Net Profit Margin'] = {
                value: ((netIncome.val / revenue.val) * 100).toFixed(2),
                date: netIncome.end,
                formatted: `${((netIncome.val / revenue.val) * 100).toFixed(2)}%`
            };
        }

        return metrics;
    }

    extractMetrics(facts, metricMap) {
        const result = {};
        
        for (const [label, factKey] of Object.entries(metricMap)) {
            const latestValue = this.getLatestValue(facts, factKey);
            if (latestValue) {
                result[label] = {
                    value: latestValue.val,
                    date: latestValue.end,
                    formatted: this.formatCurrency(latestValue.val)
                };
            }
        }
        
        return result;
    }

    getLatestValue(facts, factKey) {
        if (!facts[factKey] || !facts[factKey].units || !facts[factKey].units.USD) {
            return null;
        }

        // Filter for 2025 data
        const entries = facts[factKey].units.USD.filter(entry => {
            return entry.fy === this.currentYear || 
                   (entry.end && entry.end.includes('2025'));
        });

        if (entries.length === 0) {
            return null;
        }

        // Return the most recent entry
        return entries.sort((a, b) => new Date(b.end) - new Date(a.end))[0];
    }

    formatCurrency(value) {
        if (Math.abs(value) >= 1e12) {
            return `$${(value / 1e12).toFixed(2)}T`;
        } else if (Math.abs(value) >= 1e9) {
            return `$${(value / 1e9).toFixed(2)}B`;
        } else if (Math.abs(value) >= 1e6) {
            return `$${(value / 1e6).toFixed(2)}M`;
        } else if (Math.abs(value) >= 1e3) {
            return `$${(value / 1e3).toFixed(2)}K`;
        } else {
            return `$${value.toLocaleString()}`;
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }
}
