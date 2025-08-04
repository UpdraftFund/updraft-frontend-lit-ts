import { expect } from '@open-wc/testing';

// Mock the smart-routing handler for testing
// We'll test the logic without actually making HTTP requests

/**
 * Mock VercelRequest interface for testing
 */
interface MockVercelRequest {
  url?: string;
  headers: Record<string, string>;
}

/**
 * Mock VercelResponse interface for testing
 */
interface MockVercelResponse {
  statusCode?: number;
  headers: Record<string, string>;
  body?: string;
  redirectLocation?: string;
  setHeader: (key: string, value: string) => void;
  redirect: (code: number, location: string) => void;
  send: (body: string) => void;
}

/**
 * Create a mock response object for testing
 */
function createMockResponse(): MockVercelResponse {
  const response: MockVercelResponse = {
    headers: {},
    setHeader: function (key: string, value: string) {
      this.headers[key] = value;
    },
    redirect: function (code: number, location: string) {
      this.statusCode = code;
      this.redirectLocation = location;
    },
    send: function (body: string) {
      this.statusCode = 200;
      this.body = body;
    },
  };
  return response;
}

/**
 * Checks if the user has the 'hasUsedApp' cookie indicating they've used the app before
 * (Extracted from smart-routing.ts for testing)
 */
function hasUsedAppCookie(req: MockVercelRequest): boolean {
  const cookies = req.headers.cookie || '';
  // More robust cookie parsing to avoid false positives
  const cookieArray = cookies.split(';').map((c) => c.trim());
  return cookieArray.some((cookie) => cookie === 'hasUsedApp=true');
}

/**
 * Parse URL components from request
 * (Extracted from smart-routing.ts for testing)
 */
function parseUrlComponents(req: MockVercelRequest) {
  const pathname = req.url?.split('?')[0] || '/';
  const hostname = req.headers.host || '';

  // Filter out Vercel's internal query parameters
  let search = '';
  if (req.url?.includes('?')) {
    const urlParams = new URLSearchParams(
      req.url.substring(req.url.indexOf('?') + 1)
    );
    // Remove Vercel's internal parameters
    urlParams.delete('host');
    urlParams.delete('x-vercel-id');
    urlParams.delete('x-vercel-cache');
    // Only include search if there are remaining parameters
    if (urlParams.toString()) {
      search = '?' + urlParams.toString();
    }
  }

  return { pathname, search, hostname };
}

/**
 * Mock landing page content for testing
 */
const MOCK_LANDING_PAGE_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Updraft - Ride the Wind of Change</title>
</head>
<body>
  <h1>UPDRAFT</h1>
  <p>Where ideas take flight and communities soar together.</p>
</body>
</html>`;

/**
 * Simulate the smart routing logic for testing
 */
function simulateSmartRouting(
  req: MockVercelRequest,
  res: MockVercelResponse,
  options: {
    shouldFailLandingPage?: boolean;
  } = {}
) {
  const { pathname, search, hostname } = parseUrlComponents(req);
  const hasCookie = hasUsedAppCookie(req);

  // Add debug headers
  res.setHeader('X-Debug-Hostname', hostname);
  res.setHeader('X-Debug-Pathname', pathname);
  res.setHeader('X-Debug-Search', search);
  res.setHeader('X-Debug-Has-Cookie', hasCookie.toString());

  // Only handle www.updraft.fund requests
  if (hostname !== 'www.updraft.fund') {
    res.setHeader('X-Debug-Action', 'redirect-to-app-wrong-host');
    return res.redirect(302, `https://app.updraft.fund${pathname}${search}`);
  }

  // For www.updraft.fund root path
  if (pathname === '/') {
    // If user hasn't used the app before, show landing page
    if (!hasCookie) {
      res.setHeader('X-Debug-Action', 'serve-landing-page');
      // Simulate serving landing page
      if (options.shouldFailLandingPage) {
        res.setHeader(
          'X-Debug-Landing-Error',
          'ENOENT: no such file or directory'
        );
        res.setHeader('X-Debug-Working-Dir', '/mock/working/dir');
        return res.redirect(302, 'https://app.updraft.fund/');
      } else {
        const mockPath = '/mock/path/public/landing/index.html';
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('X-Debug-Landing-Path', mockPath);
        res.setHeader(
          'X-Debug-Landing-Size',
          MOCK_LANDING_PAGE_CONTENT.length.toString()
        );
        return res.send(MOCK_LANDING_PAGE_CONTENT);
      }
    }
    // Otherwise redirect to app
    res.setHeader('X-Debug-Action', 'redirect-to-app-has-cookie');
    return res.redirect(302, 'https://app.updraft.fund/');
  }

  // For all other www.updraft.fund paths, redirect to app (preserves social links)
  res.setHeader('X-Debug-Action', 'redirect-to-app-other-path');
  return res.redirect(302, `https://app.updraft.fund${pathname}${search}`);
}

describe('Smart Routing API', () => {
  describe('Cookie Detection', () => {
    it('should detect hasUsedApp=true cookie correctly', () => {
      const req: MockVercelRequest = {
        headers: { cookie: 'hasUsedApp=true' },
      };
      expect(hasUsedAppCookie(req)).to.be.true;
    });

    it('should detect hasUsedApp=true cookie among multiple cookies', () => {
      const req: MockVercelRequest = {
        headers: { cookie: 'other=value; hasUsedApp=true; another=value' },
      };
      expect(hasUsedAppCookie(req)).to.be.true;
    });

    it('should return false when hasUsedApp cookie is not present', () => {
      const req: MockVercelRequest = {
        headers: { cookie: 'other=value; another=value' },
      };
      expect(hasUsedAppCookie(req)).to.be.false;
    });

    it('should return false when hasUsedApp=false', () => {
      const req: MockVercelRequest = {
        headers: { cookie: 'hasUsedApp=false' },
      };
      expect(hasUsedAppCookie(req)).to.be.false;
    });

    it('should return false when no cookies are present', () => {
      const req: MockVercelRequest = {
        headers: {},
      };
      expect(hasUsedAppCookie(req)).to.be.false;
    });

    it('should avoid false positives with similar cookie names', () => {
      const req: MockVercelRequest = {
        headers: { cookie: 'hasUsedAppBefore=true; somehasUsedApp=true' },
      };
      expect(hasUsedAppCookie(req)).to.be.false;
    });
  });

  describe('URL Parsing', () => {
    it('should parse root path correctly', () => {
      const req: MockVercelRequest = {
        url: '/',
        headers: { host: 'www.updraft.fund' },
      };
      const { pathname, search, hostname } = parseUrlComponents(req);
      expect(pathname).to.equal('/');
      expect(search).to.equal('');
      expect(hostname).to.equal('www.updraft.fund');
    });

    it('should parse path with query parameters', () => {
      const req: MockVercelRequest = {
        url: '/idea/123?foo=bar&baz=qux',
        headers: { host: 'www.updraft.fund' },
      };
      const { pathname, search, hostname } = parseUrlComponents(req);
      expect(pathname).to.equal('/idea/123');
      expect(search).to.equal('?foo=bar&baz=qux');
      expect(hostname).to.equal('www.updraft.fund');
    });

    it('should handle missing URL', () => {
      const req: MockVercelRequest = {
        headers: { host: 'www.updraft.fund' },
      };
      const { pathname, search, hostname } = parseUrlComponents(req);
      expect(pathname).to.equal('/');
      expect(search).to.equal('');
      expect(hostname).to.equal('www.updraft.fund');
    });

    it('should handle missing host header', () => {
      const req: MockVercelRequest = {
        url: '/test',
        headers: {},
      };
      const { pathname, search, hostname } = parseUrlComponents(req);
      expect(pathname).to.equal('/test');
      expect(search).to.equal('');
      expect(hostname).to.equal('');
    });

    it('should filter out Vercel internal parameters', () => {
      const req: MockVercelRequest = {
        url: '/discover?search=test&host=www.updraft.fund&x-vercel-id=123',
        headers: { host: 'www.updraft.fund' },
      };
      const { pathname, search, hostname } = parseUrlComponents(req);
      expect(pathname).to.equal('/discover');
      expect(search).to.equal('?search=test');
      expect(hostname).to.equal('www.updraft.fund');
    });

    it('should return empty search when only Vercel parameters present', () => {
      const req: MockVercelRequest = {
        url: '/test?host=www.updraft.fund&x-vercel-cache=HIT',
        headers: { host: 'www.updraft.fund' },
      };
      const { pathname, search, hostname } = parseUrlComponents(req);
      expect(pathname).to.equal('/test');
      expect(search).to.equal('');
      expect(hostname).to.equal('www.updraft.fund');
    });
  });

  describe('Routing Logic', () => {
    it('should redirect non-www.updraft.fund hosts to app.updraft.fund', () => {
      const req: MockVercelRequest = {
        url: '/idea/123?foo=bar',
        headers: { host: 'app.updraft.fund' },
      };
      const res = createMockResponse();

      simulateSmartRouting(req, res);

      expect(res.statusCode).to.equal(302);
      expect(res.redirectLocation).to.equal(
        'https://app.updraft.fund/idea/123?foo=bar'
      );
      expect(res.headers['X-Debug-Action']).to.equal(
        'redirect-to-app-wrong-host'
      );
    });

    it('should serve landing page for www.updraft.fund root without cookie', () => {
      const req: MockVercelRequest = {
        url: '/',
        headers: { host: 'www.updraft.fund' },
      };
      const res = createMockResponse();

      simulateSmartRouting(req, res);

      expect(res.statusCode).to.equal(200);
      expect(res.headers['Content-Type']).to.equal('text/html');
      expect(res.headers['Cache-Control']).to.equal('public, max-age=3600');
      expect(res.headers['X-Debug-Action']).to.equal('serve-landing-page');
      expect(res.body).to.include('<!DOCTYPE html>');
      expect(res.body).to.include('UPDRAFT');
      expect(res.headers['X-Debug-Landing-Path']).to.include(
        'public/landing/index.html'
      );
      expect(res.headers['X-Debug-Landing-Size']).to.equal(
        MOCK_LANDING_PAGE_CONTENT.length.toString()
      );
    });

    it('should redirect to app when landing page fails to load', () => {
      const req: MockVercelRequest = {
        url: '/',
        headers: { host: 'www.updraft.fund' },
      };
      const res = createMockResponse();

      simulateSmartRouting(req, res, { shouldFailLandingPage: true });

      expect(res.statusCode).to.equal(302);
      expect(res.redirectLocation).to.equal('https://app.updraft.fund/');
      expect(res.headers['X-Debug-Action']).to.equal('serve-landing-page');
      expect(res.headers['X-Debug-Landing-Error']).to.include('ENOENT');
    });

    it('should redirect to app for www.updraft.fund root with cookie', () => {
      const req: MockVercelRequest = {
        url: '/',
        headers: {
          host: 'www.updraft.fund',
          cookie: 'hasUsedApp=true',
        },
      };
      const res = createMockResponse();

      simulateSmartRouting(req, res);

      expect(res.statusCode).to.equal(302);
      expect(res.redirectLocation).to.equal('https://app.updraft.fund/');
      expect(res.headers['X-Debug-Action']).to.equal(
        'redirect-to-app-has-cookie'
      );
      expect(res.headers['X-Debug-Has-Cookie']).to.equal('true');
    });

    it('should redirect www.updraft.fund non-root paths to app.updraft.fund', () => {
      const req: MockVercelRequest = {
        url: '/idea/123?ref=twitter',
        headers: { host: 'www.updraft.fund' },
      };
      const res = createMockResponse();

      simulateSmartRouting(req, res);

      expect(res.statusCode).to.equal(302);
      expect(res.redirectLocation).to.equal(
        'https://app.updraft.fund/idea/123?ref=twitter'
      );
      expect(res.headers['X-Debug-Action']).to.equal(
        'redirect-to-app-other-path'
      );
    });

    it('should preserve query parameters in redirects', () => {
      const req: MockVercelRequest = {
        url: '/discover?search=[songaday] [redux]&sort=recent',
        headers: { host: 'www.updraft.fund' },
      };
      const res = createMockResponse();

      simulateSmartRouting(req, res);

      expect(res.statusCode).to.equal(302);
      // URLSearchParams properly encodes the parameters
      expect(res.redirectLocation).to.equal(
        'https://app.updraft.fund/discover?search=%5Bsongaday%5D+%5Bredux%5D&sort=recent'
      );
      expect(res.headers['X-Debug-Search']).to.equal(
        '?search=%5Bsongaday%5D+%5Bredux%5D&sort=recent'
      );
    });
  });

  describe('Debug Headers', () => {
    it('should set all debug headers correctly', () => {
      const req: MockVercelRequest = {
        url: '/test?param=value',
        headers: {
          host: 'www.updraft.fund',
          cookie: 'hasUsedApp=true',
        },
      };
      const res = createMockResponse();

      simulateSmartRouting(req, res);

      expect(res.headers['X-Debug-Hostname']).to.equal('www.updraft.fund');
      expect(res.headers['X-Debug-Pathname']).to.equal('/test');
      expect(res.headers['X-Debug-Search']).to.equal('?param=value');
      expect(res.headers['X-Debug-Has-Cookie']).to.equal('true');
      expect(res.headers['X-Debug-Action']).to.equal(
        'redirect-to-app-other-path'
      );
    });

    it('should handle missing cookie in debug headers', () => {
      const req: MockVercelRequest = {
        url: '/',
        headers: { host: 'www.updraft.fund' },
      };
      const res = createMockResponse();

      simulateSmartRouting(req, res);

      expect(res.headers['X-Debug-Has-Cookie']).to.equal('false');
    });
  });
});
