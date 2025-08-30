/**
 * LLM Financial Analysis Service
 * Uses OpenRouter API to generate AI-powered financial summaries
 */

class LLMFinancialAnalyst {
    constructor() {
        this.apiKey = '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';
        this.model = 'deepseek/deepseek-r1-0528:free';
        this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
        
        // System prompt for 30-year experienced financial analyst persona
        this.systemPrompt = `You are Marcus Rothschild, a highly respected financial analyst with 30 years of experience on Wall Street. You've worked at Goldman Sachs, JP Morgan, and currently serve as a Senior Portfolio Manager at a top-tier hedge fund managing $2.8 billion in assets.

EXPERTISE & BACKGROUND:
- CFA Charter holder since 1998
- MBA in Finance from Wharton School
- Specialized in equity research, fundamental analysis, and financial modeling
- Published over 200 research reports covering Fortune 500 companies
- Regular contributor to Bloomberg, CNBC, and Financial Times
- Known for identifying undervalued stocks and predicting market trends
- Successfully navigated the 2008 financial crisis, dot-com bubble, and COVID-19 market volatility

ANALYSIS STYLE:
- Direct, professional, and data-driven insights
- Balance quantitative metrics with qualitative business fundamentals  
- Focus on long-term value creation and sustainable growth
- Identify key risks and opportunities
- Compare performance against industry benchmarks and peers
- Provide actionable investment implications

COMMUNICATION APPROACH:
- Write in a confident, authoritative tone befitting your experience
- Use Wall Street terminology appropriately but remain accessible
- Structure analysis with clear sections: Overview, Strengths, Concerns, Outlook
- Include specific financial ratios and percentages when relevant
- Conclude with a clear investment thesis or recommendation tendency

ANALYSIS FRAMEWORK:
1. **Financial Health Assessment**: Liquidity, solvency, profitability trends
2. **Growth Analysis**: Revenue growth, margin expansion, operational efficiency
3. **Balance Sheet Strength**: Debt levels, cash position, working capital management
4. **Competitive Position**: Market share trends, competitive advantages
5. **Management Effectiveness**: Capital allocation, operational execution
6. **Valuation Perspective**: Whether current metrics suggest over/under valuation
7. **Risk Factors**: Key business, financial, and market risks to monitor

When analyzing SEC EDGAR financial data, provide a comprehensive yet concise summary (300-500 words) that institutional investors and sophisticated retail investors would find valuable. Focus on the most recent fiscal year data (2025) while noting significant year-over-year trends when relevant.

Remember: Your reputation has been built on accurate, insightful analysis that helps investors make informed decisions. Maintain that standard of excellence.`;
    }

    /**
     * Generate financial analysis using LLM
     * @param {Object} companyData - Processed financial data from SEC EDGAR
     * @param {string} companyName - Name of the company
     * @returns {Promise<string>} AI-generated financial analysis
     */
    async generateFinancialAnalysis(companyData, companyName) {
        try {
            // Prepare financial data summary for LLM
            const financialSummary = this.prepareFinancialSummary(companyData, companyName);
            
            const userPrompt = `Please analyze the following 2025 SEC EDGAR financial data for ${companyName} and provide your professional assessment:

${financialSummary}

Provide a comprehensive financial analysis covering the company's current financial health, growth trajectory, competitive position, and investment outlook. Focus on what the numbers tell us about the business fundamentals and management effectiveness.`;

            const requestBody = {
                model: this.model,
                messages: [
                    {
                        role: "system",
                        content: this.systemPrompt
                    },
                    {
                        role: "user", 
                        content: userPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            };

            const response = await fetch(this.baseUrl, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "HTTP-Referer": window.location.origin,
                    "X-Title": "Financial Lookup App - AI Analysis",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            
            if (!result.choices || !result.choices[0] || !result.choices[0].message) {
                throw new Error('Invalid response format from LLM API');
            }

            return result.choices[0].message.content;

        } catch (error) {
            console.error('LLM Financial Analysis Error:', error);
            throw new Error(`Failed to generate AI analysis: ${error.message}`);
        }
    }

    /**
     * Prepare financial data in a format suitable for LLM analysis
     * @param {Object} companyData - Processed financial data
     * @param {string} companyName - Company name
     * @returns {string} Formatted financial summary
     */
    prepareFinancialSummary(companyData, companyName) {
        const { keyMetrics, balanceSheet, incomeStatement, cashFlow } = companyData;
        
        let summary = `COMPANY: ${companyName}\n`;
        summary += `FISCAL YEAR: 2025 (Latest Available Data)\n\n`;

        // Key Metrics Section
        if (keyMetrics && Object.keys(keyMetrics).length > 0) {
            summary += "KEY FINANCIAL METRICS (2025):\n";
            Object.entries(keyMetrics).forEach(([metric, data]) => {
                if (data && data.value !== undefined) {
                    const value = typeof data.value === 'number' ? 
                        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(data.value) :
                        data.value;
                    summary += `• ${metric}: ${value}\n`;
                }
            });
            summary += "\n";
        }

        // Balance Sheet Section
        if (balanceSheet && Object.keys(balanceSheet).length > 0) {
            summary += "BALANCE SHEET HIGHLIGHTS (2025):\n";
            Object.entries(balanceSheet).forEach(([item, data]) => {
                if (data && data.value !== undefined) {
                    const value = typeof data.value === 'number' ? 
                        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(data.value) :
                        data.value;
                    summary += `• ${item}: ${value}\n`;
                }
            });
            summary += "\n";
        }

        // Income Statement Section
        if (incomeStatement && Object.keys(incomeStatement).length > 0) {
            summary += "INCOME STATEMENT HIGHLIGHTS (2025):\n";
            Object.entries(incomeStatement).forEach(([item, data]) => {
                if (data && data.value !== undefined) {
                    const value = typeof data.value === 'number' ? 
                        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(data.value) :
                        data.value;
                    summary += `• ${item}: ${value}\n`;
                }
            });
            summary += "\n";
        }

        // Cash Flow Section
        if (cashFlow && Object.keys(cashFlow).length > 0) {
            summary += "CASH FLOW HIGHLIGHTS (2025):\n";
            Object.entries(cashFlow).forEach(([item, data]) => {
                if (data && data.value !== undefined) {
                    const value = typeof data.value === 'number' ? 
                        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(data.value) :
                        data.value;
                    summary += `• ${item}: ${value}\n`;
                }
            });
        }

        return summary;
    }

    /**
     * Display AI analysis in container with professional styling
     * @param {string} analysis - AI-generated analysis text
     * @param {HTMLElement} container - Container element
     */
    displayAnalysis(analysis, container) {
        const analysisHTML = `
            <div class="ai-analysis-container">
                <div class="analysis-header">
                    <div class="analyst-info">
                        <h2>🎯 Professional Financial Analysis</h2>
                        <p class="analyst-credit">Analysis by Marcus Rothschild, CFA • 30 Years Wall Street Experience</p>
                    </div>
                </div>
                <div class="analysis-content">
                    <div class="analysis-text">
                        ${this.formatAnalysisText(analysis)}
                    </div>
                </div>
                <div class="analysis-footer">
                    <small>⚡ Powered by AI • Based on latest SEC EDGAR filings</small>
                </div>
            </div>
        `;

        container.innerHTML = analysisHTML;
    }

    /**
     * Format analysis text with proper paragraphs and styling
     * @param {string} text - Raw analysis text
     * @returns {string} Formatted HTML
     */
    formatAnalysisText(text) {
        return text
            .split('\n\n')
            .map(paragraph => paragraph.trim())
            .filter(paragraph => paragraph.length > 0)
            .map(paragraph => `<p>${paragraph}</p>`)
            .join('');
    }

    /**
     * Show loading state for AI analysis
     * @param {HTMLElement} container - Container element
     */
    showLoadingState(container) {
        container.innerHTML = `
            <div class="ai-analysis-loading">
                <div class="loading-spinner"></div>
                <h3>Generating Professional Financial Analysis...</h3>
                <p>Our AI financial analyst is reviewing the latest SEC filings</p>
            </div>
        `;
    }

    /**
     * Show error state for AI analysis
     * @param {HTMLElement} container - Container element
     * @param {string} error - Error message
     */
    showErrorState(container, error) {
        container.innerHTML = `
            <div class="ai-analysis-error">
                <h3>⚠️ Analysis Temporarily Unavailable</h3>
                <p>Unable to generate AI financial analysis: ${error}</p>
                <small>Please try refreshing the page or contact support if the issue persists.</small>
            </div>
        `;
    }
}

// Create global instance
window.llmAnalyst = new LLMFinancialAnalyst();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LLMFinancialAnalyst;
}
