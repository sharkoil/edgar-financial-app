// Stock Price Chart Component with Chart.js
class StockChart {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.chart = null;
        this.alphaVantageService = new AlphaVantageService();
        
        // Default options
        this.options = {
            height: Math.min(300, options.height || 300), // Max 300 pixels
            showVolume: true,
            chartType: 'line', // 'line' or 'candlestick'
            timeRange: 'compact', // 'compact' (100 days) or 'full'
            theme: 'dark',
            maxYValue: 2000, // Maximum Y-axis value
            ...options
        };

        this.chartConfig = this.getChartConfig();
    }

    getChartConfig() {
        const isDark = this.options.theme === 'dark';
        
        return {
            type: 'line',
            data: {
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: undefined, // Allow flexible aspect ratio
                backgroundColor: isDark ? '#0d1117' : '#ffffff',
                plugins: {
                    title: {
                        display: true,
                        text: 'Stock Price History',
                        color: isDark ? '#f0f6fc' : '#24292f',
                        font: {
                            size: 18,
                            weight: 'bold'
                        },
                        padding: 20
                    },
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            color: isDark ? '#f0f6fc' : '#24292f',
                            usePointStyle: true,
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: isDark ? '#21262d' : '#ffffff',
                        titleColor: isDark ? '#f0f6fc' : '#24292f',
                        bodyColor: isDark ? '#f0f6fc' : '#24292f',
                        borderColor: isDark ? '#30363d' : '#d0d7de',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        callbacks: {
                            title: (context) => {
                                return new Date(context[0].parsed.x).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                });
                            },
                            label: (context) => {
                                const value = context.parsed.y;
                                return `${context.dataset.label}: $${value.toFixed(2)}`;
                            },
                            afterBody: (context) => {
                                const dataPoint = context[0].raw;
                                if (dataPoint && dataPoint.volume) {
                                    return [`Volume: ${this.formatVolume(dataPoint.volume)}`];
                                }
                                return [];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'MMM dd'
                            }
                        },
                        grid: {
                            color: isDark ? '#30363d' : '#d0d7de'
                        },
                        ticks: {
                            color: isDark ? '#8b949e' : '#656d76'
                        }
                    },
                    y: {
                        beginAtZero: false,
                        position: 'left',
                        max: this.options.maxYValue, // Limit Y-axis to specified max value
                        title: {
                            display: true,
                            text: 'Price ($)',
                            color: isDark ? '#8b949e' : '#656d76'
                        },
                        grid: {
                            color: isDark ? '#30363d' : '#d0d7de'
                        },
                        ticks: {
                            color: isDark ? '#8b949e' : '#656d76',
                            callback: function(value) {
                                return '$' + value.toFixed(2);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    intersect: false
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 6
                    },
                    line: {
                        tension: 0.1
                    }
                }
            }
        };
    }

    async renderChart(symbol, ticker = null) {
        const container = document.getElementById(this.containerId);
        if (!container) {
            throw new Error(`Container with ID '${this.containerId}' not found`);
        }

        try {
            // Show loading state
            this.showLoading(container);

            // Fetch stock data
            const stockData = await this.alphaVantageService.getDailyStockData(
                ticker || symbol, 
                this.options.timeRange
            );

            // Create chart
            this.createChart(container, stockData);

        } catch (error) {
            console.error('Failed to render stock chart:', error);
            this.showError(container, error.message);
        }
    }

    createChart(container, stockData) {
        // Clear previous content
        container.innerHTML = '';

        // Create chart header with stock info
        const headerDiv = this.createChartHeader(stockData);
        container.appendChild(headerDiv);

        // Create canvas for chart
        const canvas = document.createElement('canvas');
        canvas.style.height = `${this.options.height}px`;
        canvas.style.width = '100%';
        canvas.style.maxHeight = '300px'; // Enforce maximum height
        container.appendChild(canvas);

        // Prepare chart data
        const chartData = this.prepareChartData(stockData);
        
        // Update chart configuration
        this.chartConfig.data = chartData;
        this.chartConfig.options.plugins.title.text = `${stockData.symbol} Stock Price History`;

        // Create Chart.js instance
        const ctx = canvas.getContext('2d');
        this.chart = new Chart(ctx, this.chartConfig);
    }

    createChartHeader(stockData) {
        const header = document.createElement('div');
        header.className = 'stock-chart-header';
        
        const priceChange = stockData.priceChange;
        const changeClass = priceChange.isPositive ? 'positive' : 'negative';
        const changeSymbol = priceChange.isPositive ? '+' : '';

        header.innerHTML = `
            <div class="stock-info">
                <h3 class="stock-symbol">${stockData.symbol}</h3>
                <div class="stock-price">
                    <span class="current-price">$${stockData.latestPrice.toFixed(2)}</span>
                    <span class="price-change ${changeClass}">
                        ${changeSymbol}$${priceChange.amount.toFixed(2)} 
                        (${changeSymbol}${priceChange.percentage.toFixed(2)}%)
                    </span>
                </div>
                <div class="stock-meta">
                    <span class="last-updated">Last updated: ${new Date(stockData.lastRefreshed).toLocaleString()}</span>
                </div>
            </div>
            ${stockData.summary ? this.createSummaryInfo(stockData.summary) : ''}
        `;

        return header;
    }

    createSummaryInfo(summary) {
        return `
            <div class="stock-summary">
                <div class="summary-item">
                    <span class="label">52W High:</span>
                    <span class="value">$${summary.high52Week.toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="label">52W Low:</span>
                    <span class="value">$${summary.low52Week.toFixed(2)}</span>
                </div>
                <div class="summary-item">
                    <span class="label">Volatility:</span>
                    <span class="value">${summary.volatility.toFixed(1)}%</span>
                </div>
                <div class="summary-item">
                    <span class="label">Avg Volume:</span>
                    <span class="value">${this.formatVolume(summary.averageVolume)}</span>
                </div>
            </div>
        `;
    }

    prepareChartData(stockData) {
        const prices = stockData.prices.map(point => ({
            x: new Date(point.date),
            y: point.close,
            volume: point.volume,
            open: point.open,
            high: point.high,
            low: point.low
        }));

        return {
            datasets: [{
                label: `${stockData.symbol} Close Price`,
                data: prices,
                borderColor: '#58a6ff',
                backgroundColor: 'rgba(88, 166, 255, 0.1)',
                borderWidth: 2,
                fill: this.options.chartType === 'area',
                pointBackgroundColor: '#58a6ff',
                pointBorderColor: '#58a6ff',
                pointHoverBackgroundColor: '#ffffff',
                pointHoverBorderColor: '#58a6ff',
                pointHoverBorderWidth: 2
            }]
        };
    }

    showLoading(container) {
        container.innerHTML = `
            <div class="chart-loading">
                <div class="loading-spinner"></div>
                <p>Loading stock price data...</p>
            </div>
        `;
    }

    showError(container, message) {
        container.innerHTML = `
            <div class="chart-error">
                <h4>📉 Unable to Load Stock Chart</h4>
                <p>${message}</p>
                <small>Stock price data may not be available for this company.</small>
            </div>
        `;
    }

    formatVolume(volume) {
        if (volume >= 1e9) {
            return (volume / 1e9).toFixed(1) + 'B';
        } else if (volume >= 1e6) {
            return (volume / 1e6).toFixed(1) + 'M';
        } else if (volume >= 1e3) {
            return (volume / 1e3).toFixed(1) + 'K';
        }
        return volume.toLocaleString();
    }

    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }

    updateTheme(theme) {
        this.options.theme = theme;
        this.chartConfig = this.getChartConfig();
        
        if (this.chart) {
            this.chart.options = this.chartConfig.options;
            this.chart.update();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StockChart;
}
