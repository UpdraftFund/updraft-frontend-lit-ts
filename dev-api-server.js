#!/usr/bin/env node

import { config } from 'dotenv';
import { createServer } from 'http';

// Load environment variables from .env.local
config({ path: '.env.local' });
import { parse } from 'url';

// Parse JSON body from request
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    if (req.method !== 'POST') {
      resolve(null);
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : null;
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

// Create Next.js-compatible request object for API routes
function createApiReq(req, query, body) {
  return {
    ...req,
    query,
    headers: req.headers,
    body,
    method: req.method,
  };
}

function createApiRes(res) {
  const apiRes = {
    status: (code) => {
      res.statusCode = code;
      return apiRes;
    },
    json: (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    },
    send: (data) => {
      res.end(data);
    },
    end: (data) => {
      res.end(data);
    },
    setHeader: (name, value) => {
      res.setHeader(name, value);
      return apiRes;
    },
    redirect: (code, url) => {
      res.statusCode = code;
      res.setHeader('Location', url);
      res.end();
    },
  };
  return apiRes;
}

const server = createServer(async (req, res) => {
  const parsedUrl = parse(req.url, true);
  const { pathname, query } = parsedUrl;

  // Set CORS headers for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // Parse request body for POST requests
    const body = await parseJsonBody(req);
    const apiReq = createApiReq(req, query, body);
    const apiRes = createApiRes(res);

    // Simulate Vercel routing behavior for www.updraft.fund
    const host = req.headers.host || '';
    if (host === 'www.updraft.fund' || host.includes('www.updraft.fund')) {
      const { default: handler } = await import('./api/smart-routing.ts');
      await handler(apiReq, apiRes);
      return;
    }

    // Route API requests
    if (pathname === '/api/campaigns/campaigns') {
      const { default: handler } = await import('./api/campaigns/campaigns.ts');
      await handler(apiReq, apiRes);
    } else if (pathname === '/api/campaigns/tags') {
      const { default: handler } = await import('./api/campaigns/tags.ts');
      await handler(apiReq, apiRes);
    } else if (pathname === '/api/campaigns/submit') {
      const { default: handler } = await import('./api/campaigns/submit.ts');
      await handler(apiReq, apiRes);
    } else if (pathname === '/api/social-meta') {
      const { default: handler } = await import('./api/social-meta.ts');
      await handler(apiReq, apiRes);
    } else if (pathname === '/api/smart-routing') {
      const { default: handler } = await import('./api/smart-routing.ts');
      await handler(apiReq, apiRes);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Not Found' }));
    }
  } catch (error) {
    console.error('API Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({ message: 'Internal Server Error', error: error.message })
    );
  }
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Development API server running on http://localhost:${port}`);
});
