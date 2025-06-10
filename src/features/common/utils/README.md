# Environment Configuration

This project uses Vite's environment variables system to manage API keys and other sensitive information.

## API Keys and Sensitive Information

Sensitive information like API keys are managed using Vite's environment variables system:

1. **For local development**: Using `.env.local` files in the project root
2. **For production**: Using Vercel's environment variables system

## Local Development Setup

1. Copy `.env.example` to `.env.local` in the project root
2. Add your actual API keys to `.env.local`

```bash
cp .env.example .env.local
# Then edit .env.local with your actual values
```

## Production Setup (Vercel)

For production deployments on Vercel:

1. Go to your Vercel project settings
2. Navigate to the "Environment Variables" section
3. Add the following variables:
    - `VITE_GRAPH_API_KEY`: Your Graph API key
   - `VITE_APP_ENV`: Set to `production` for production deployments or `preview` for preview deployments

## Available Environment Variables

- `VITE_GRAPH_API_KEY`: API key for The Graph API
- `VITE_APP_ENV`: Environment setting that controls which networks and endpoints are used. Values can be:
    - Empty or undefined: Local development environment (default) - uses Arbitrum Sepolia
    - `preview`: Preview deployment environment - uses Arbitrum Sepolia
    - `production`: Production deployment environment - uses Arbitrum One

## How It Works

Vite exposes environment variables to your code through the `import.meta.env` object. Only variables prefixed with
`VITE_` are exposed to your frontend code for security reasons.

In our code, we access these variables directly:

```typescript
const apiKey = import.meta.env.VITE_GRAPH_API_KEY || '';
const isProd = import.meta.env.VITE_APP_ENV === 'production';
```

This approach ensures that:

1. In development, values from `.env.local` are used
2. In production, Vercel's environment variables are used
3. The code works consistently in both environments
4. Sensitive information is not committed to the repository
5. Network configuration automatically adapts to the deployment environment
6. Subgraph endpoints match the deployed smart contracts on each network
