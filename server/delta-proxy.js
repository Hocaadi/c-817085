// Delta Exchange API Proxy Server
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto');
const app = express();

// Enable cross-origin requests and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API credentials - should be moved to environment variables in production
const API_KEY = "1mbsfq46ryz0flQOhhe9QrdpWrOzdz";
const API_SECRET = "h84TwZ1qrljLCDwT1vnkBLMsp7WEKv8K3kDeqIqD0CQW4ht2yACtu0UU1aCJ";
const BASE_URL = "https://api.india.delta.exchange";

// Helper function to generate Delta Exchange signature
function generateSignature(timestamp, requestPath, requestBody = '') {
  const message = timestamp + requestPath + (requestBody ? JSON.stringify(requestBody) : '');
  return crypto.createHmac('sha256', API_SECRET).update(message).digest('hex');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Delta Exchange API proxy server is running' });
});

// Proxy all requests to Delta Exchange API
app.all('/api/*', async (req, res) => {
  try {
    const requestPath = req.url.replace('/api', '');
    const targetUrl = `${BASE_URL}${requestPath}`;
    
    // Generate timestamp for Delta Exchange auth
    const timestamp = Math.floor(Date.now() / 1000) + 5; // Add 5-second buffer

    // Add Delta Exchange authentication headers
    const signature = generateSignature(timestamp, requestPath, req.method !== 'GET' ? req.body : '');
    
    console.log(`[Proxy] Forwarding ${req.method} request to: ${targetUrl}`);
    
    // Forward the request to Delta Exchange
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'API-Key': API_KEY,
        'API-Timestamp': timestamp.toString(),
        'API-Signature': signature,
        // Forward any additional headers from the original request
        ...req.headers,
        // Remove headers that might cause issues
        host: undefined,
        'content-length': undefined,
      },
    });
    
    // Log success (but not response data for privacy/security)
    console.log(`[Proxy] Request successful: ${response.status}`);
    
    // Return the response to the client
    res.status(response.status).json(response.data);
  } catch (error) {
    // Log error details
    console.error('[Proxy] Error forwarding request:', 
      error.response?.status, 
      error.response?.data || error.message
    );
    
    // Return the error to the client
    res.status(error.response?.status || 500).json(
      error.response?.data || { error: error.message }
    );
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Delta Exchange API proxy server running on port ${PORT}`);
  console.log(`Access the proxy at http://localhost:${PORT}/api/...`);
}); 