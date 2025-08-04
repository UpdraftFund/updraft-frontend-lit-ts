import { expect } from '@open-wc/testing';

/**
 * Integration tests for the dev API server
 * These tests make actual HTTP requests to test the full integration
 */

const DEV_API_BASE_URL = 'http://localhost:3001';

/**
 * Helper function to make HTTP requests with custom headers
 */
async function makeRequest(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${DEV_API_BASE_URL}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      'User-Agent': 'test-runner',
      ...options.headers,
    },
  });
}

/**
 * Helper function to check if dev server is running
 */
async function isDevServerRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${DEV_API_BASE_URL}/api/campaigns/campaigns`);
    return response.status !== 0; // Any response means server is running
  } catch {
    return false;
  }
}

describe('Dev API Server Integration', () => {
  before(async function () {
    // Skip tests if dev server is not running
    const serverRunning = await isDevServerRunning();
    if (!serverRunning) {
      console.warn(
        '⚠️  Dev API server not running - skipping integration tests'
      );
      console.warn(
        '   Run "yarn dev" in another terminal to enable these tests'
      );
      this.skip();
    }
  });

  describe('Smart Routing Integration', () => {
    it('should serve landing page for www.updraft.fund root without cookie', async () => {
      const response = await makeRequest('/', {
        headers: {
          Host: 'www.updraft.fund',
        },
      });

      expect(response.status).to.equal(200);
      expect(response.headers.get('Content-Type')).to.include('text/html');
      expect(response.headers.get('Cache-Control')).to.equal(
        'public, max-age=3600'
      );
      expect(response.headers.get('X-Debug-Hostname')).to.equal(
        'www.updraft.fund'
      );
      expect(response.headers.get('X-Debug-Pathname')).to.equal('/');
      expect(response.headers.get('X-Debug-Has-Cookie')).to.equal('false');
      expect(response.headers.get('X-Debug-Action')).to.equal(
        'serve-landing-page'
      );

      const body = await response.text();
      expect(body).to.include('<!DOCTYPE html>');
      expect(body).to.include('UPDRAFT');
      expect(body).to.include('Where ideas take flight');
    });

    it('should redirect to app for www.updraft.fund root with hasUsedApp cookie', async () => {
      const response = await makeRequest('/', {
        headers: {
          Host: 'www.updraft.fund',
          Cookie: 'hasUsedApp=true',
        },
        redirect: 'manual', // Don't follow redirects automatically
      });

      expect(response.status).to.equal(302);
      expect(response.headers.get('Location')).to.equal(
        'https://app.updraft.fund/'
      );
      expect(response.headers.get('X-Debug-Hostname')).to.equal(
        'www.updraft.fund'
      );
      expect(response.headers.get('X-Debug-Pathname')).to.equal('/');
      expect(response.headers.get('X-Debug-Has-Cookie')).to.equal('true');
      expect(response.headers.get('X-Debug-Action')).to.equal(
        'redirect-to-app-has-cookie'
      );
    });

    it('should redirect www.updraft.fund non-root paths to app.updraft.fund', async () => {
      const response = await makeRequest('/idea/123?foo=bar', {
        headers: {
          Host: 'www.updraft.fund',
        },
        redirect: 'manual',
      });

      expect(response.status).to.equal(302);
      expect(response.headers.get('Location')).to.equal(
        'https://app.updraft.fund/idea/123?foo=bar'
      );
      expect(response.headers.get('X-Debug-Hostname')).to.equal(
        'www.updraft.fund'
      );
      expect(response.headers.get('X-Debug-Pathname')).to.equal('/idea/123');
      expect(response.headers.get('X-Debug-Search')).to.equal('?foo=bar');
      expect(response.headers.get('X-Debug-Action')).to.equal(
        'redirect-to-app-other-path'
      );
    });

    it('should redirect non-www.updraft.fund hosts to app.updraft.fund', async () => {
      const response = await makeRequest('/test', {
        headers: {
          Host: 'app.updraft.fund',
        },
        redirect: 'manual',
      });

      expect(response.status).to.equal(302);
      expect(response.headers.get('Location')).to.equal(
        'https://app.updraft.fund/test'
      );
      expect(response.headers.get('X-Debug-Hostname')).to.equal(
        'app.updraft.fund'
      );
      expect(response.headers.get('X-Debug-Action')).to.equal(
        'redirect-to-app-wrong-host'
      );
    });

    it('should preserve complex query parameters in redirects', async () => {
      // Test with unencoded input to see how URLSearchParams handles it
      const inputQuery = '?search=[songaday] [redux]&sort=recent&filter=active';
      const response = await makeRequest(`/discover${inputQuery}`, {
        headers: {
          Host: 'www.updraft.fund',
        },
        redirect: 'manual',
      });

      expect(response.status).to.equal(302);

      // URLSearchParams will properly encode the parameters
      const location = response.headers.get('Location');
      expect(location).to.include('https://app.updraft.fund/discover?');
      expect(location).to.include('search=');
      expect(location).to.include('sort=recent');
      expect(location).to.include('filter=active');

      // The search debug header should match the location query
      const debugSearch = response.headers.get('X-Debug-Search');
      expect(debugSearch).to.include('search=');
      expect(debugSearch).to.include('sort=recent');
      expect(debugSearch).to.include('filter=active');
    });

    it('should handle multiple cookies correctly', async () => {
      const response = await makeRequest('/', {
        headers: {
          Host: 'www.updraft.fund',
          Cookie: 'other=value; hasUsedApp=true; another=test',
        },
        redirect: 'manual',
      });

      expect(response.status).to.equal(302);
      expect(response.headers.get('X-Debug-Has-Cookie')).to.equal('true');
      expect(response.headers.get('X-Debug-Action')).to.equal(
        'redirect-to-app-has-cookie'
      );
    });

    it('should not be fooled by similar cookie names', async () => {
      const response = await makeRequest('/', {
        headers: {
          Host: 'www.updraft.fund',
          Cookie: 'hasUsedAppBefore=true; somehasUsedApp=true',
        },
      });

      expect(response.status).to.equal(200); // Should serve landing page
      expect(response.headers.get('X-Debug-Has-Cookie')).to.equal('false');
      expect(response.headers.get('X-Debug-Action')).to.equal(
        'serve-landing-page'
      );
    });
  });

  describe('Other API Endpoints', () => {
    it('should handle campaigns endpoint', async () => {
      const response = await makeRequest('/api/campaigns/campaigns');

      // Should not be a 404
      expect(response.status).to.not.equal(404);
      // Should be either 200 (success) or 500 (server error, but endpoint exists)
      expect([200, 500]).to.include(response.status);
    });

    it('should handle social-meta endpoint', async () => {
      const response = await makeRequest('/api/social-meta?type=idea&id=test');

      // Should not be a 404
      expect(response.status).to.not.equal(404);
      // Should be either 200, 302 (redirect), or 500
      expect([200, 302, 500]).to.include(response.status);
    });

    it('should return 404 for unknown endpoints', async () => {
      const response = await makeRequest('/api/unknown-endpoint');

      expect(response.status).to.equal(404);

      const body = await response.json();
      expect(body.message).to.equal('Not Found');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await makeRequest('/api/campaigns/campaigns');

      expect(response.headers.get('Access-Control-Allow-Origin')).to.equal('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).to.include(
        'GET'
      );
      expect(response.headers.get('Access-Control-Allow-Headers')).to.include(
        'Content-Type'
      );
    });

    it('should handle OPTIONS requests', async () => {
      const response = await makeRequest('/api/campaigns/campaigns', {
        method: 'OPTIONS',
      });

      expect(response.status).to.equal(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).to.equal('*');
    });
  });
});
