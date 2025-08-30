// Environment configuration with security best practices
class Config {
    constructor() {
        // Default to demo key for development - should be replaced with environment variable
        this.ALPHA_VANTAGE_API_KEY = this.getApiKey();
        this.ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';
        this.REQUEST_TIMEOUT = 10000; // 10 seconds
        this.RATE_LIMIT_DELAY = 200; // 200ms between requests
    }

    getApiKey() {
        // In production, this should come from environment variables
        // For now, using the provided key with proper handling
        const providedKey = 'WNZ9Z35IUAUASVMV';
        
        // Check if running in Node.js environment (server-side)
        if (typeof process !== 'undefined' && process.env) {
            return process.env.ALPHA_VANTAGE_API_KEY || providedKey;
        }
        
        // Client-side fallback
        return providedKey;
    }

    isValidApiKey(key) {
        return key && key.length > 8 && key !== 'demo';
    }

    getApiUrl(params) {
        // Use proxy endpoint to avoid CORS issues when in browser
        const baseUrl = typeof window !== 'undefined' 
            ? '/api/alphavantage/' 
            : this.ALPHA_VANTAGE_BASE_URL;
        
        const url = new URL(baseUrl, typeof window !== 'undefined' ? window.location.origin : undefined);
        url.searchParams.append('apikey', this.ALPHA_VANTAGE_API_KEY);
        
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
        
        return url.toString();
    }
}

// Export singleton instance
const config = new Config();

// Validate API key on initialization
if (!config.isValidApiKey(config.ALPHA_VANTAGE_API_KEY)) {
    console.warn('⚠️ Invalid Alpha Vantage API key detected. Please set a valid API key.');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = config;
}
