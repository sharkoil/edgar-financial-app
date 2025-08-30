// Financial Report Generation
class FinancialReportGenerator {
    constructor() {
        this.processor = new FinancialDataProcessor();
        this.init();
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const cik = urlParams.get('cik');
        const ticker = urlParams.get('ticker');
        
        if (!cik) {
            this.showError('No company selected. Please go back and select a company.');
            return;
        }

        await this.generateReport(cik, ticker);
    }

    async generateReport(cik, ticker = null) {
        try {
            this.showLoading('Fetching financial data...');
            
            const rawData = await this.processor.fetchCompanyFinancials(cik);
            const processedData = this.processor.processFinancialData(rawData);
            
            this.renderReport(processedData, ticker);
            
        } catch (error) {
            console.error('Failed to generate report:', error);
            this.showError(`Failed to load financial data: ${error.message}`);
        }
    }

    renderReport(data, ticker = null) {
        const container = document.getElementById('reportContainer');
        
        container.innerHTML = `
            <a href="index.html" class="back-button">← Back to Search</a>
            
            <div class="report-header">
                <h1 class="company-title">${data.company.name}</h1>
                <p class="report-subtitle">2025 Financial Report | CIK: ${data.company.cik}</p>
            </div>

            ${ticker ? this.renderStockChartSection(ticker) : ''}
            ${this.renderFinancialSection('Key Metrics', data.keyMetrics)}
            ${this.renderFinancialSection('Balance Sheet', data.balanceSheet)}
            ${this.renderIncomeStatementTable(data.incomeStatement)}
            ${this.renderCashFlowTable(data.cashFlow)}
        `;

        // Initialize stock chart if ticker is available
        if (ticker) {
            this.initializeStockChart(ticker);
        }
    }

    renderFinancialSection(title, metrics) {
        if (!metrics || Object.keys(metrics).length === 0) {
            return `
                <div class="financial-section">
                    <h2 class="section-title">${title}</h2>
                    <p style="color: #8b949e; text-align: center; padding: 2rem;">
                        No ${title.toLowerCase()} data available for 2025
                    </p>
                </div>
            `;
        }

        const metricsHtml = Object.entries(metrics)
            .map(([label, data]) => this.renderMetricItem(label, data))
            .join('');

        return `
            <div class="financial-section">
                <h2 class="section-title">${title}</h2>
                <div class="metrics-grid">
                    ${metricsHtml}
                </div>
            </div>
        `;
    }

    renderMetricItem(label, data) {
        if (!data) {
            return `
                <div class="metric-item">
                    <div class="metric-label">${label}</div>
                    <div class="metric-value">N/A</div>
                    <div class="metric-date">No data available</div>
                </div>
            `;
        }

        return `
            <div class="metric-item">
                <div class="metric-label">${label}</div>
                <div class="metric-value">${data.formatted || data.value}</div>
                <div class="metric-date">As of ${this.processor.formatDate(data.date)}</div>
            </div>
        `;
    }

    renderIncomeStatementTable(incomeStatement) {
        if (!incomeStatement || Object.keys(incomeStatement).length === 0) {
            return `
                <div class="financial-section">
                    <h2 class="section-title">Income Statement</h2>
                    <p style="color: #8b949e; text-align: center; padding: 2rem;">
                        No income statement data available for 2025
                    </p>
                </div>
            `;
        }

        const tableRows = Object.entries(incomeStatement)
            .map(([label, data]) => {
                if (!data) {
                    console.log(`Missing data for income statement metric: ${label}`);
                    return '';
                }
                console.log(`Rendering income statement row: ${label} = ${data.formatted}`);
                return `
                    <tr>
                        <td class="metric-label">${label}</td>
                        <td class="metric-value">${data.formatted}</td>
                        <td class="metric-date">${this.processor.formatDate(data.date)}</td>
                    </tr>
                `;
            })
            .filter(row => row)
            .join('');

        console.log(`Generated ${tableRows ? 'table rows' : 'no rows'} for income statement`);

        return `
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
    }

    renderCashFlowTable(cashFlow) {
        if (!cashFlow || Object.keys(cashFlow).length === 0) {
            return `
                <div class="financial-section">
                    <h2 class="section-title">Cash Flow Statement</h2>
                    <p style="color: #8b949e; text-align: center; padding: 2rem;">
                        No cash flow data available for 2025
                    </p>
                </div>
            `;
        }

        const tableRows = Object.entries(cashFlow)
            .map(([label, data]) => {
                if (!data) return '';
                
                // Determine if this is a cash outflow (negative impact)
                const isOutflow = label.includes('Capital Expenditures') || 
                                 (data.value < 0 && !label.includes('Operating'));
                
                return `
                    <tr>
                        <td class="metric-label">${label}</td>
                        <td class="metric-value ${isOutflow ? 'negative' : ''}">${data.formatted}</td>
                        <td class="metric-date">${this.processor.formatDate(data.date)}</td>
                    </tr>
                `;
            })
            .filter(row => row)
            .join('');

        return `
            <div class="financial-section">
                <h2 class="section-title">Cash Flow Statement</h2>
                <div class="table-container">
                    <table class="financial-table">
                        <thead>
                            <tr>
                                <th>Cash Flow Activity</th>
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
    }

    renderStockChartSection(ticker) {
        return `
            <div class="financial-section">
                <h2 class="section-title">📈 Stock Price History</h2>
                <div id="stockChartContainer" class="stock-chart-container">
                    <div class="chart-loading">
                        <div class="loading-spinner"></div>
                        <p>Loading stock chart for ${ticker}...</p>
                    </div>
                </div>
            </div>
        `;
    }

    async initializeStockChart(ticker) {
        try {
            console.log(`Initializing stock chart for ${ticker}`);
            
            // Small delay to ensure DOM is ready
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const stockChart = new StockChart('stockChartContainer', {
                height: 400,
                theme: 'dark',
                timeRange: 'compact'
            });

            await stockChart.renderChart(ticker);
            
        } catch (error) {
            console.error('Failed to initialize stock chart:', error);
            
            // Show error in chart container
            const container = document.getElementById('stockChartContainer');
            if (container) {
                container.innerHTML = `
                    <div class="chart-error">
                        <h4>📉 Unable to Load Stock Chart</h4>
                        <p>Stock price data is not available for ${ticker}</p>
                        <small>This may happen if the ticker symbol is not recognized by Alpha Vantage or if there are API limitations.</small>
                    </div>
                `;
            }
        }
    }

    showLoading(message) {
        const container = document.getElementById('reportContainer');
        container.innerHTML = `
            <div class="loading">
                <p>${message}</p>
            </div>
        `;
    }

    showError(message) {
        const container = document.getElementById('reportContainer');
        container.innerHTML = `
            <a href="index.html" class="back-button">← Back to Search</a>
            <div class="error">
                <h2>Error</h2>
                <p>${message}</p>
            </div>
        `;
    }
}

// Initialize report generator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FinancialReportGenerator();
});
