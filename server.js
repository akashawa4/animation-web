const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const app = express();
const PORT = process.env.PORT || 8080;

// Load environment variables
dotenv.config();

// Middleware
app.use(express.json());
app.use(express.static(__dirname));
app.use(cors());

// Set security headers for camera access
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    next();
});

// AnimeGAN endpoint
app.post('/animegan', async (req, res) => {
    try {
        const { imageUrl } = req.body;
        
        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }
        
        // Replicate API token
        const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
        
        if (!REPLICATE_API_TOKEN) {
            return res.status(500).json({ error: 'Replicate API token not configured' });
        }
        
        // Create prediction
        const response = await axios.post(
            'https://api.replicate.com/v1/predictions',
            {
                version: "9f0bd56b", // AnimeGANv3 version ID
                input: {
                    image: imageUrl,
                    style: "shinkai" // Default style, can be made configurable
                }
            },
            {
                headers: {
                    'Authorization': `Token ${REPLICATE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        const prediction = response.data;
        
        // Poll for results (Replicate is async)
        let result = prediction;
        while (result.status !== 'succeeded' && result.status !== 'failed') {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            const pollResponse = await axios.get(
                `https://api.replicate.com/v1/predictions/${prediction.id}`,
                {
                    headers: {
                        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            result = pollResponse.data;
        }
        
        if (result.status === 'failed') {
            return res.status(500).json({ error: 'AnimeGAN processing failed', details: result.error });
        }
        
        return res.json(result);
        
    } catch (error) {
        console.error('AnimeGAN error:', error.response?.data || error.message);
        return res.status(500).json({ 
            error: 'Failed to process image with AnimeGAN',
            details: error.response?.data || error.message
        });
    }
});

// Serve index.html for all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Check if SSL certificates exist
const sslOptions = {
    key: fs.existsSync('server.key') ? fs.readFileSync('server.key') : null,
    cert: fs.existsSync('server.crt') ? fs.readFileSync('server.crt') : null
};

// Create server (HTTPS if certificates exist, otherwise HTTP)
let server;
if (sslOptions.key && sslOptions.cert) {
    server = https.createServer(sslOptions, app);
    console.log(`Starting HTTPS server on port ${PORT}`);
} else {
    server = http.createServer(app);
    console.log(`Starting HTTP server on port ${PORT} (camera access may be restricted)`);
    console.log('For camera access, consider generating SSL certificates:');
    console.log('openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout server.key -out server.crt -subj "/CN=localhost"');
}

// Start server
server.listen(PORT, () => {
    const protocol = sslOptions.key && sslOptions.cert ? 'https' : 'http';
    console.log(`Server running at ${protocol}://localhost:${PORT}`);
    console.log(`AnimeGAN endpoint available at ${protocol}://localhost:${PORT}/animegan`);
});