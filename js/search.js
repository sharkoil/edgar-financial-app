// Company Search Functionality
class CompanySearch {
    constructor() {
        this.companies = [];
        this.selectedCompany = null;
        this.currentIndex = -1;
        this.init();
    }

    async init() {
        await this.loadCompanies();
        this.bindEvents();
    }

    async loadCompanies() {
        try {
            const response = await fetch('./data/companies.json');
            this.companies = await response.json();
            console.log(`Loaded ${this.companies.length} companies`);
        } catch (error) {
            console.error('Failed to load companies:', error);
            // Fallback to live API
            await this.loadCompaniesFromAPI();
        }
    }

    async loadCompaniesFromAPI() {
        try {
            const response = await fetch('https://www.sec.gov/files/company_tickers.json');
            const tickers = await response.json();
            
            this.companies = Object.values(tickers).map(company => ({
                cik: company.cik_str.toString().padStart(10, '0'),
                ticker: company.ticker,
                name: company.title
            }));
            
            console.log(`Loaded ${this.companies.length} companies from API`);
        } catch (error) {
            console.error('Failed to load companies from API:', error);
        }
    }

    bindEvents() {
        const searchInput = document.getElementById('searchInput');
        const suggestions = document.getElementById('suggestions');
        const searchButton = document.getElementById('searchButton');

        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        searchInput.addEventListener('keydown', (e) => {
            this.handleKeydown(e);
        });

        searchButton.addEventListener('click', () => {
            this.submitSearch();
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSuggestions();
            }
        });
    }

    handleSearch(query) {
        if (query.length < 2) {
            this.hideSuggestions();
            this.hideSearchButton();
            return;
        }

        const matches = this.findMatches(query);
        this.showSuggestions(matches.slice(0, 10)); // Show top 10 matches
    }

    findMatches(query) {
        const searchTerm = query.toLowerCase();
        
        return this.companies.filter(company => 
            company.ticker.toLowerCase().includes(searchTerm) ||
            company.name.toLowerCase().includes(searchTerm)
        ).sort((a, b) => {
            // Prioritize ticker matches
            const aTickerMatch = a.ticker.toLowerCase().startsWith(searchTerm);
            const bTickerMatch = b.ticker.toLowerCase().startsWith(searchTerm);
            
            if (aTickerMatch && !bTickerMatch) return -1;
            if (!aTickerMatch && bTickerMatch) return 1;
            
            // Then prioritize name matches
            const aNameMatch = a.name.toLowerCase().startsWith(searchTerm);
            const bNameMatch = b.name.toLowerCase().startsWith(searchTerm);
            
            if (aNameMatch && !bNameMatch) return -1;
            if (!aNameMatch && bNameMatch) return 1;
            
            return 0;
        });
    }

    showSuggestions(matches) {
        const suggestions = document.getElementById('suggestions');
        
        if (matches.length === 0) {
            this.hideSuggestions();
            return;
        }

        suggestions.innerHTML = '';
        
        matches.forEach((company, index) => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `
                <span class="ticker">${company.ticker}</span>
                <span class="company-name">${company.name}</span>
            `;
            
            item.addEventListener('click', () => {
                this.selectCompany(company);
            });
            
            suggestions.appendChild(item);
        });
        
        suggestions.style.display = 'block';
        this.currentIndex = -1;
    }

    hideSuggestions() {
        const suggestions = document.getElementById('suggestions');
        suggestions.style.display = 'none';
        this.currentIndex = -1;
    }

    selectCompany(company) {
        this.selectedCompany = company;
        const searchInput = document.getElementById('searchInput');
        searchInput.value = `${company.ticker} - ${company.name}`;
        this.hideSuggestions();
        this.showSearchButton();
    }

    showSearchButton() {
        const searchButton = document.getElementById('searchButton');
        searchButton.classList.add('visible');
    }

    hideSearchButton() {
        const searchButton = document.getElementById('searchButton');
        searchButton.classList.remove('visible');
        this.selectedCompany = null;
    }

    handleKeydown(e) {
        const suggestions = document.getElementById('suggestions');
        const items = suggestions.querySelectorAll('.suggestion-item');
        
        if (suggestions.style.display === 'none' || items.length === 0) {
            if (e.key === 'Enter' && this.selectedCompany) {
                this.submitSearch();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.currentIndex = Math.min(this.currentIndex + 1, items.length - 1);
                this.updateActiveItem(items);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.currentIndex = Math.max(this.currentIndex - 1, -1);
                this.updateActiveItem(items);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.currentIndex >= 0 && items[this.currentIndex]) {
                    items[this.currentIndex].click();
                } else if (this.selectedCompany) {
                    this.submitSearch();
                }
                break;
                
            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }

    updateActiveItem(items) {
        items.forEach((item, index) => {
            item.classList.toggle('active', index === this.currentIndex);
        });
    }

    submitSearch() {
        if (!this.selectedCompany) {
            alert('Please select a company from the suggestions');
            return;
        }
        
        // Navigate to report page with CIK and ticker
        window.location.href = `report.html?cik=${this.selectedCompany.cik}&ticker=${this.selectedCompany.ticker}`;
    }
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CompanySearch();
});
