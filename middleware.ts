// Vercel Routing Middleware
// https://vercel.com/docs/routing-middleware

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const hostname = url.hostname;

  // If we reach here, it means:
  // 1. pathname === '/' (guaranteed by matcher)
  // 2. No hasUsedApp cookie (otherwise would have been redirected)
  // 3. Only serve landing page for www.updraft.fund

  if (hostname === 'www.updraft.fund') {
    // Rewrite to serve the landing page (public/landing/index.html is served at /landing/index.html)
    return fetch(new URL('/landing/index.html', request.url));
  }

  // For other hostnames (app.updraft.fund, preview deployments), continue normal processing
  // Return undefined to continue to normal static file serving
  return undefined;
}

export const config = {
  matcher: [
    /*
     * Only match the root path for www.updraft.fund
     * All other paths are handled by redirects in vercel.json
     */
    '/',
  ],
};
