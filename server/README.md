# Delta Exchange API Proxy Server

This proxy server solves the IP whitelisting issue with Delta Exchange API by providing a consistent IP address for API requests.

## How It Works

1. Your application sends requests to this proxy server
2. The proxy server authenticates and forwards these requests to Delta Exchange API
3. Delta Exchange only sees the IP address of the server where this proxy is running
4. You only need to whitelist the proxy's IP address once in Delta Exchange

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure the Proxy

Edit `delta-proxy.js` to update your Delta Exchange API credentials:

```javascript
// API credentials - should be moved to environment variables in production
const API_KEY = "your_api_key";
const API_SECRET = "your_api_secret";
```

For production, you should use environment variables instead.

### 3. Start the Proxy Server

```bash
npm start
```

The server will start on port 3000 by default. You can change this by setting the PORT environment variable.

### 4. Configure Your Application

In your application, set `USE_PROXY` to `true` in the DeltaExchangeClient.ts file:

```typescript
// Configuration for proxy usage
const USE_PROXY = true; // Set to true to use the proxy server
const PROXY_URL = 'http://localhost:3000/api'; // The URL of your proxy server
```

## Production Deployment

For production use, deploy this proxy server to a reliable host with a static IP address, such as:

- A low-cost VPS (DigitalOcean, Linode, etc.)
- Heroku with a dedicated IP add-on
- Railway.app
- Render.com

After deployment, update the `PROXY_URL` in your application to point to your deployed proxy.

## Security Considerations

1. **Never expose your API credentials**: In production, use environment variables
2. **Add authentication**: For better security, add authentication to the proxy
3. **Use HTTPS**: Always use HTTPS in production 
4. **Limit IP access**: Configure your server firewall to only accept connections from your application

## Troubleshooting

- If you see "IP Not Whitelisted" errors while proxy mode is enabled, ensure the proxy server is running
- Check the proxy server logs for detailed error information
- Verify that your application can connect to the proxy server 