const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const TurndownService = require('turndown');

const app = express();
const port = process.env.PORT || 3000;
const turndownService = new TurndownService();

// Health check route
app.get('/', (req, res) => {
    res.json({ status: 'Active', message: 'Use /api/extract?url=YOUR_URL' });
});

// Main extraction route
app.get('/api/extract', async (req, res) => {
    const { url } = req.query;
    
    if (!url) {
        return res.status(400).json({ error: 'Missing url parameter.' });
    }

    try {
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        
        const $ = cheerio.load(response.data);
        
        // Remove non-content elements to ensure clean data
        $('script, style, noscript, nav, footer, header, aside, iframe').remove();
        
        const markdown = turndownService.turndown($.html());
        
        res.json({ 
            success: true, 
            url: url, 
            markdown: markdown 
        });
        
    } catch (error) {
        res.status(500).json({ error: 'Extraction failed', details: error.message });
    }
});

app.listen(port, () => console.log(`Listening on port ${port}`));
