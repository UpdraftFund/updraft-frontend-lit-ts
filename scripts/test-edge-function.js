#!/usr/bin/env node

/**
 * Test script for the edge function logic
 * This script tests the core functionality without requiring deployment
 */

// Mock environment
process.env.VITE_GRAPH_API_KEY = 'test-key';

// Mock Buffer for hex decoding (since we're not using viem in edge function)
global.Buffer = Buffer;

// Import the functions we want to test
const { middleware } = require('../middleware.ts');

// Mock NextRequest and NextResponse
class MockNextRequest {
  constructor(url, userAgent = '') {
    this.url = url;
    this.nextUrl = new URL(url);
    this.headers = new Map([['user-agent', userAgent]]);
  }

  get(name) {
    return this.headers.get(name);
  }
}

class MockNextResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.headers = init.headers || {};
    this.status = init.status || 200;
  }

  static next() {
    return new MockNextResponse('next', { status: 200 });
  }
}

// Mock fetch for GraphQL requests
global.fetch = async (url, options) => {
  console.log('Mock GraphQL request:', { url, options: options?.body });

  // Parse the GraphQL query to determine response
  const body = JSON.parse(options?.body || '{}');
  const query = body.query || '';

  if (query.includes('query Idea')) {
    return {
      ok: true,
      json: async () => ({
        data: {
          idea: {
            id: '0x123',
            name: 'Test Idea',
            description: 'This is a test idea for social media sharing',
            creator: {
              id: '0xabc',
              profile: '0x7b226e616d65223a2254657374205573657222', // hex encoded {"name":"Test User"}
            },
          },
        },
      }),
    };
  }

  if (query.includes('query Solution')) {
    return {
      ok: true,
      json: async () => ({
        data: {
          solution: {
            id: '0x456',
            info: '0x7b226e616d65223a22546573742053616c7574696f6e222c226465736372697074696f6e223a2254657374206465736372697074696f6e227d', // hex encoded {"name":"Test Solution","description":"Test description"}
            drafter: {
              id: '0xdef',
              profile: '0x7b226e616d65223a22546573742044726166746572227d', // hex encoded {"name":"Test Drafter"}
            },
            idea: {
              id: '0x123',
              name: 'Test Idea',
            },
          },
        },
      }),
    };
  }

  return {
    ok: false,
    status: 404,
    json: async () => ({ errors: ['Not found'] }),
  };
};

async function testCrawlerDetection() {
  console.log('\n=== Testing Crawler Detection ===');

  // Test regular user (should pass through)
  const regularRequest = new MockNextRequest(
    'https://test.com/idea/0x123',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  );

  const regularResponse = await middleware(regularRequest);
  console.log(
    'Regular user:',
    regularResponse.status === 200 ? 'PASS (passed through)' : 'FAIL'
  );

  // Test Facebook crawler (should generate meta tags)
  const facebookRequest = new MockNextRequest(
    'https://test.com/idea/0x123',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
  );

  const facebookResponse = await middleware(facebookRequest);
  const isHtml = facebookResponse.headers['Content-Type'] === 'text/html';
  const hasMetaTags =
    facebookResponse.body && facebookResponse.body.includes('og:title');

  console.log(
    'Facebook crawler:',
    isHtml && hasMetaTags ? 'PASS (generated HTML)' : 'FAIL'
  );

  if (hasMetaTags) {
    console.log('Generated HTML preview:');
    console.log(facebookResponse.body.substring(0, 500) + '...');
  }
}

async function testIdeaPage() {
  console.log('\n=== Testing Idea Page ===');

  const request = new MockNextRequest(
    'https://test.com/idea/0x123',
    'twitterbot/1.0'
  );

  const response = await middleware(request);

  if (response.body && response.body.includes('Test Idea | Updraft')) {
    console.log('Idea page: PASS (correct title)');
  } else {
    console.log('Idea page: FAIL (incorrect title)');
  }

  if (response.body && response.body.includes('Created by Test User')) {
    console.log('Creator attribution: PASS');
  } else {
    console.log('Creator attribution: FAIL');
  }
}

async function testSolutionPage() {
  console.log('\n=== Testing Solution Page ===');

  const request = new MockNextRequest(
    'https://test.com/solution/0x456',
    'linkedinbot/1.0'
  );

  const response = await middleware(request);

  if (response.body && response.body.includes('Test Solution | Updraft')) {
    console.log('Solution page: PASS (correct title)');
  } else {
    console.log('Solution page: FAIL (incorrect title)');
  }

  if (response.body && response.body.includes('Test Drafter')) {
    console.log('Drafter attribution: PASS');
  } else {
    console.log('Drafter attribution: FAIL');
  }

  if (response.body && response.body.includes('for "Test Idea"')) {
    console.log('Idea context: PASS');
  } else {
    console.log('Idea context: FAIL');
  }
}

async function testInvalidRoutes() {
  console.log('\n=== Testing Invalid Routes ===');

  // Test non-existent idea
  const invalidRequest = new MockNextRequest(
    'https://test.com/idea/0xinvalid',
    'facebookexternalhit/1.1'
  );

  const invalidResponse = await middleware(invalidRequest);
  console.log(
    'Invalid idea:',
    invalidResponse.status === 200 ? 'PASS (fallback)' : 'FAIL'
  );

  // Test non-matching route
  const homeRequest = new MockNextRequest(
    'https://test.com/',
    'facebookexternalhit/1.1'
  );

  const homeResponse = await middleware(homeRequest);
  console.log(
    'Home page:',
    homeResponse.status === 200 ? 'PASS (passed through)' : 'FAIL'
  );
}

async function runTests() {
  console.log('🧪 Testing Edge Function Logic');
  console.log('================================');

  try {
    await testCrawlerDetection();
    await testIdeaPage();
    await testSolutionPage();
    await testInvalidRoutes();

    console.log('\n✅ All tests completed!');
    console.log('\nTo test in production:');
    console.log('1. Deploy to Vercel');
    console.log(
      '2. Test with: curl -H "User-Agent: facebookexternalhit/1.1" https://your-domain.com/idea/0x123'
    );
    console.log('3. Validate with social media tools');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };
