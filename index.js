const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const TurndownService = require('turndown');

const app = express();
const port = process.env.PORT || 3000;
const turndownService = new TurndownService();

// Set up the API Key (This will pull from Render's secure environment variables)
// If no variable is found, it defaults to a test key.
const VALID_API_KEY = process.env.API_KEY || 'simpaira_demo_key';

// Security Middleware
const authenticateKey = (req, res, next) => {
    // Check for the key in headers (for RapidAPI) or query string (for easy mobile testing)
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey || apiKey !== VALID_API_KEY) {
        return res.status(401).json({ 
            success: false,
            error: 'Unauthorized', 
            message: 'A valid API key is required.' 
        });
    }
    next();
};

// Health check route (Unprotected so monitoring tools can ping it)
app.get('/', (req, res) => {
    res.json({ status: 'Active', message: 'Service is running securely.' });
});

// Main extraction route (Protected by authenticateKey)
app.get('/api/extract', authenticateKey, async (req, res) => {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ success: false, error: 'Missing url parameter.' });
    }

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        const $ = cheerio.load(response.data);
        
        // Strip out non-content tags for lean data
        $('script, style, noscript, nav, footer, header, aside, iframe').remove();
        
        const markdown = turndownService.turndown($.html());
        
        res.json({ 
            success: true, 
            url: url, 
            markdown: markdown 
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: 'Extraction failed', details: error.message });
    }
});

app.listen(port, () => console.log(`Listening on port ${port}`));
