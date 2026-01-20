// Market Data API Service
// Handles all external API calls for real-time pricing

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const priceCache = new Map();

// Symbol mapping for different APIs
const CRYPTO_SYMBOL_MAP = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'USDT': 'tether',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'SOL': 'solana',
    'DOT': 'polkadot',
    'MATIC': 'polygon'
};

// Get cached price if available and fresh
const getCachedPrice = (symbol) => {
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.price;
    }
    return null;
};

// Set price in cache
const setCachedPrice = (symbol, price) => {
    priceCache.set(symbol, {
        price,
        timestamp: Date.now()
    });
};

// Fetch cryptocurrency price from CoinGecko (no API key required)
export const fetchCryptoPrice = async (symbol) => {
    const upperSymbol = symbol.toUpperCase();
    const cached = getCachedPrice(`CRYPTO_${upperSymbol}`);
    if (cached !== null) return cached;

    try {
        // Map common symbols to CoinGecko IDs
        const coinId = CRYPTO_SYMBOL_MAP[upperSymbol] || symbol.toLowerCase();

        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
            { headers: { 'Accept': 'application/json' } }
        );

        if (!response.ok) throw new Error('CoinGecko API error');

        const data = await response.json();
        const price = data[coinId]?.usd;

        if (!price) throw new Error('Price not found');

        setCachedPrice(`CRYPTO_${upperSymbol}`, price);
        return price;
    } catch (error) {
        console.error(`Error fetching crypto price for ${symbol}:`, error);
        throw error;
    }
};

// Fetch stock/ETF price from Finnhub (requires API key)
export const fetchStockPrice = async (symbol, apiKey) => {
    const upperSymbol = symbol.toUpperCase();
    const cached = getCachedPrice(`STOCK_${upperSymbol}`);
    if (cached !== null) return cached;

    if (!apiKey) {
        throw new Error('Finnhub API key required for stock prices');
    }

    try {
        const response = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${upperSymbol}&token=${apiKey}`,
            { headers: { 'Accept': 'application/json' } }
        );

        if (!response.ok) throw new Error('Finnhub API error');

        const data = await response.json();
        const price = data.c; // Current price

        if (!price || price === 0) throw new Error('Invalid price data');

        setCachedPrice(`STOCK_${upperSymbol}`, price);
        return price;
    } catch (error) {
        console.error(`Error fetching stock price for ${symbol}:`, error);
        throw error;
    }
};

// Fallback: Alpha Vantage (requires API key, free tier: 25 requests/day)
export const fetchStockPriceAlphaVantage = async (symbol, apiKey) => {
    const upperSymbol = symbol.toUpperCase();

    try {
        const response = await fetch(
            `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${upperSymbol}&apikey=${apiKey}`,
            { headers: { 'Accept': 'application/json' } }
        );

        if (!response.ok) throw new Error('Alpha Vantage API error');

        const data = await response.json();
        const price = parseFloat(data['Global Quote']?.['05. price']);

        if (!price) throw new Error('Invalid price data');

        setCachedPrice(`STOCK_${upperSymbol}`, price);
        return price;
    } catch (error) {
        console.error(`Error fetching from Alpha Vantage for ${symbol}:`, error);
        throw error;
    }
};

// Unified price fetcher with automatic routing
export const fetchAssetPrice = async (asset, apiKeys = {}) => {
    const { assetType, symbol } = asset;

    try {
        if (assetType === 'crypto') {
            return await fetchCryptoPrice(symbol);
        } else if (assetType === 'stock' || assetType === 'etf') {
            // Try Finnhub first
            if (apiKeys.finnhub) {
                try {
                    return await fetchStockPrice(symbol, apiKeys.finnhub);
                } catch (error) {
                    // Fallback to Alpha Vantage if available
                    if (apiKeys.alphaVantage) {
                        return await fetchStockPriceAlphaVantage(symbol, apiKeys.alphaVantage);
                    }
                    throw error;
                }
            } else {
                throw new Error('No API key configured for stocks');
            }
        } else {
            throw new Error('Unsupported asset type');
        }
    } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
        return null;
    }
};

// Batch update prices with rate limiting
export const batchUpdatePrices = async (investments, apiKeys = {}, onProgress) => {
    const results = [];
    const delayBetweenCalls = 100; // 100ms delay to respect rate limits

    for (let i = 0; i < investments.length; i++) {
        const investment = investments[i];

        try {
            const price = await fetchAssetPrice(investment, apiKeys);
            results.push({
                id: investment.id,
                success: true,
                price,
                timestamp: Date.now()
            });
        } catch (error) {
            results.push({
                id: investment.id,
                success: false,
                error: error.message
            });
        }

        // Report progress
        if (onProgress) {
            onProgress((i + 1) / investments.length);
        }

        // Delay between calls to respect rate limits
        if (i < investments.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenCalls));
        }
    }

    return results;
};

// Search for symbols (simple client-side suggestions)
export const searchSymbol = (query, type) => {
    const upperQuery = query.toUpperCase();

    if (type === 'crypto') {
        const cryptos = Object.keys(CRYPTO_SYMBOL_MAP);
        return cryptos.filter(symbol => symbol.includes(upperQuery));
    }

    // For stocks, return empty (would need a search API endpoint)
    return [];
};

// Calculate ROI percentage
export const calculateROI = (buyPrice, currentPrice, quantity = 1) => {
    if (!buyPrice || !currentPrice) return 0;
    return ((currentPrice - buyPrice) / buyPrice) * 100;
};

// Calculate P&L (Profit & Loss)
export const calculatePL = (buyPrice, currentPrice, quantity) => {
    if (!buyPrice || !currentPrice || !quantity) return 0;
    return (currentPrice - buyPrice) * quantity;
};

// Get data freshness indicator
export const getDataFreshness = (lastUpdate) => {
    if (!lastUpdate) return 'stale';

    const minutesAgo = (Date.now() - lastUpdate) / (1000 * 60);

    if (minutesAgo < 5) return 'fresh';
    if (minutesAgo < 60) return 'moderate';
    return 'stale';
};
