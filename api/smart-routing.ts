// Vercel Edge Function for smart routing between landing page and app
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Checks if the user has the 'hasUsedApp' cookie indicating they've used the app before
 */
function hasUsedAppCookie(req: VercelRequest): boolean {
  const cookies = req.headers.cookie || '';
  // More robust cookie parsing to avoid false positives
  const cookieArray = cookies.split(';').map((c) => c.trim());
  return cookieArray.some((cookie) => cookie === 'hasUsedApp=true');
}

/**
 * Serves the landing page HTML file
 */
function serveLandingPage(res: VercelResponse): void {
  try {
    // Read the landing page file from the public directory
    const landingPagePath = join(
      process.cwd(),
      'public',
      'landing',
      'index.html'
    );
    const landingPageContent = readFileSync(landingPagePath, 'utf8');

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour - landing page is static
    res.setHeader('X-Debug-Landing-Path', landingPagePath);
    res.setHeader('X-Debug-Landing-Size', landingPageContent.length.toString());
    res.send(landingPageContent);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.setHeader('X-Debug-Landing-Error', errorMessage);
    res.setHeader('X-Debug-Working-Dir', process.cwd());
    // Fallback: redirect to app
    res.redirect(302, 'https://app.updraft.fund/');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Parse the URL properly - req.url is just the path + query, not full URL
  const pathname = req.url?.split('?')[0] || '/';
  const search = req.url?.includes('?')
    ? req.url.substring(req.url.indexOf('?'))
    : '';
  const hostname = req.headers.host || '';
  const hasCookie = hasUsedAppCookie(req);

  // Add debug headers (will be visible in browser dev tools)
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
      return serveLandingPage(res);
    }
    // Otherwise redirect to app
    res.setHeader('X-Debug-Action', 'redirect-to-app-has-cookie');
    return res.redirect(302, 'https://app.updraft.fund/');
  }

  // For all other www.updraft.fund paths, redirect to app (preserves social links)
  res.setHeader('X-Debug-Action', 'redirect-to-app-other-path');
  return res.redirect(302, `https://app.updraft.fund${pathname}${search}`);
}
