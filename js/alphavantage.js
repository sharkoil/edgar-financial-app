// Alpha Vantage API Service with best practices
class AlphaVantageService {
    constructor() {
        this.config = typeof module !== 'undefined' ? require('./config.js') : window.config || config;
        this.lastRequestTime = 0;
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
    }

    async makeRequest(url) {
        // Rate limiting - ensure minimum delay between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.config.RATE_LIMIT_DELAY) {
            await this.delay(this.config.RATE_LIMIT_DELAY - timeSinceLastRequest);
        }

        this.lastRequestTime = Date.now();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.REQUEST_TIMEOUT);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Financial-Lookup-App/1.0'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Check for API-specific errors
            if (data['Error Message']) {
                throw new Error(`Alpha Vantage API Error: ${data['Error Message']}`);
            }

            if (data['Note']) {
                throw new Error(`Alpha Vantage Rate Limit: ${data['Note']}`);
            }

            return data;

        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timeout - Alpha Vantage API took too long to respond');
            }
            throw error;
        }
    }

    async getDailyStockData(symbol, outputSize = 'compact') {
        const cacheKey = `daily_${symbol}_${outputSize}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                console.log(`📄 Using cached data for ${symbol}`);
                return cached.data;
            }
        }

        console.log(`📈 Fetching daily stock data for ${symbol}`);

        const url = this.config.getApiUrl({
            function: 'TIME_SERIES_DAILY',
            symbol: symbol.toUpperCase(),
            outputsize: outputSize
        });

        try {
            const data = await this.makeRequest(url);
            
            // Validate response structure
            if (!data['Time Series (Daily)']) {
                throw new Error(`No daily time series data found for symbol: ${symbol}`);
            }

            const processedData = this.processDailyData(data, symbol);
            
            // Cache the processed data
            this.cache.set(cacheKey, {
                data: processedData,
                timestamp: Date.now()
            });

            return processedData;

        } catch (error) {
            console.error(`Failed to fetch stock data for ${symbol}:`, error);
            throw new Error(`Unable to fetch stock data for ${symbol}: ${error.message}`);
        }
    }

    processDailyData(rawData, symbol) {
        const timeSeries = rawData['Time Series (Daily)'];
        const metadata = rawData['Meta Data'];

        const prices = [];
        const dates = Object.keys(timeSeries)
            .sort((a, b) => new Date(a) - new Date(b)) // Sort chronologically
            .slice(-252); // Last ~1 year of trading days

        dates.forEach(date => {
            const dayData = timeSeries[date];
            prices.push({
                date: date,
                open: parseFloat(dayData['1. open']),
                high: parseFloat(dayData['2. high']),
                low: parseFloat(dayData['3. low']),
                close: parseFloat(dayData['4. close']),
                volume: parseInt(dayData['5. volume'])
            });
        });

        return {
            symbol: symbol.toUpperCase(),
            lastRefreshed: metadata['3. Last Refreshed'],
            timeZone: metadata['5. Time Zone'],
            prices: prices,
            latestPrice: prices[prices.length - 1]?.close || 0,
            priceChange: this.calculatePriceChange(prices),
            summary: this.generateSummary(prices)
        };
    }

    calculatePriceChange(prices) {
        if (prices.length < 2) return { amount: 0, percentage: 0 };

        const latest = prices[prices.length - 1];
        const previous = prices[prices.length - 2];
        
        const amount = latest.close - previous.close;
        const percentage = (amount / previous.close) * 100;

        return {
            amount: amount,
            percentage: percentage,
            isPositive: amount >= 0
        };
    }

    generateSummary(prices) {
        if (prices.length === 0) return null;

        const closes = prices.map(p => p.close);
        const volumes = prices.map(p => p.volume);

        return {
            high52Week: Math.max(...closes),
            low52Week: Math.min(...closes),
            averageVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
            volatility: this.calculateVolatility(closes)
        };
    }

    calculateVolatility(prices) {
        if (prices.length < 2) return 0;

        const returns = [];
        for (let i = 1; i < prices.length; i++) {
            returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
        }

        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
        
        return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility %
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clearCache() {
        this.cache.clear();
        console.log('📄 Alpha Vantage cache cleared');
    }
}

// Export for both Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlphaVantageService;
}
