/**
 * News Search Module
 * Handles fetching and displaying company news using Serper API
 */

class NewsService {
    constructor() {
        this.apiKey = 'b9719d19dcda85be1faa543b42b5a0a106529e63';
        this.baseUrl = 'https://google.serper.dev/search';
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Search for news about a company
     * @param {string} companyName - Name of the company to search for
     * @param {number} numResults - Number of results to return (default: 5)
     * @returns {Promise<Array>} Array of news articles
     */
    async searchNews(companyName, numResults = 5) {
        const cacheKey = `${companyName}-${numResults}`;
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.data;
        }

        try {
            const headers = new Headers();
            headers.append("X-API-KEY", this.apiKey);
            headers.append("Content-Type", "application/json");

            const requestBody = JSON.stringify({
                "q": `${companyName} news`,
                "type": "news",
                "num": numResults
            });

            const requestOptions = {
                method: "POST",
                headers: headers,
                body: requestBody,
                redirect: "follow"
            };

            const response = await fetch(this.baseUrl, requestOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            // Extract news articles
            const articles = result.news || [];
            
            // Cache the results
            this.cache.set(cacheKey, {
                data: articles,
                timestamp: Date.now()
            });

            return articles;
        } catch (error) {
            console.error('Error fetching news:', error);
            throw new Error(`Failed to fetch news: ${error.message}`);
        }
    }

    /**
     * Display news articles in a container
     * @param {Array} articles - Array of news articles
     * @param {HTMLElement} container - Container element to display news
     */
    displayNews(articles, container) {
        if (!articles || articles.length === 0) {
            container.innerHTML = `
                <div class="no-news">
                    <i class="news-icon">📰</i>
                    <p>No recent news articles found</p>
                </div>
            `;
            return;
        }

        const newsHTML = articles.map((article, index) => {
            const date = article.date ? new Date(article.date).toLocaleDateString() : 'Recent';
            const snippet = article.snippet || '';
            
            return `
                <div class="news-article" data-index="${index}">
                    <div class="news-header">
                        <h3 class="news-title">
                            <a href="${article.link}" target="_blank" rel="noopener noreferrer">
                                ${article.title}
                            </a>
                        </h3>
                        <div class="news-meta">
                            <span class="news-source">${article.source}</span>
                            <span class="news-date">${date}</span>
                        </div>
                    </div>
                    ${snippet ? `<p class="news-snippet">${snippet}</p>` : ''}
                    <div class="news-actions">
                        <a href="${article.link}" target="_blank" class="read-more-btn">
                            Read Article <i>↗</i>
                        </a>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="news-container">
                <div class="news-header-section">
                    <h2>📰 Latest News</h2>
                    <p class="news-subtitle">Recent news articles and updates</p>
                </div>
                <div class="news-articles">
                    ${newsHTML}
                </div>
            </div>
        `;
    }

    /**
     * Create and show loading state for news section
     * @param {HTMLElement} container - Container element
     */
    showLoadingState(container) {
        container.innerHTML = `
            <div class="news-loading">
                <div class="loading-spinner"></div>
                <p>Fetching latest news...</p>
            </div>
        `;
    }

    /**
     * Show error state for news section
     * @param {HTMLElement} container - Container element
     * @param {string} error - Error message
     */
    showErrorState(container, error) {
        container.innerHTML = `
            <div class="news-error">
                <i class="error-icon">⚠️</i>
                <h3>Unable to load news</h3>
                <p>${error}</p>
                <button class="retry-btn" onclick="window.location.reload()">
                    Try Again
                </button>
            </div>
        `;
    }
}

// Create global instance
window.newsService = new NewsService();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsService;
}
