// Vercel Edge Function for smart routing between landing page and app
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Checks if the user has the 'hasUsedApp' cookie indicating they've used the app before
 */
function hasUsedAppCookie(req: VercelRequest): boolean {
  const cookies = req.headers.cookie || '';
  return cookies.includes('hasUsedApp=true');
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
    res.send(landingPageContent);
  } catch (error) {
    console.error('Error serving landing page:', error);
    // Fallback: redirect to app
    res.redirect(302, 'https://app.updraft.fund/');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = new URL(req.url!, `https://${req.headers.host}`);
  const hostname = url.hostname;
  const pathname = url.pathname;

  // Only handle www.updraft.fund requests
  if (hostname !== 'www.updraft.fund') {
    return res.redirect(
      302,
      `https://app.updraft.fund${pathname}${url.search}`
    );
  }

  // For www.updraft.fund root path
  if (pathname === '/') {
    // If user hasn't used the app before, show landing page
    if (!hasUsedAppCookie(req)) {
      return serveLandingPage(res);
    }
    // Otherwise redirect to app
    return res.redirect(302, 'https://app.updraft.fund/');
  }

  // For all other www.updraft.fund paths, redirect to app (preserves social links)
  return res.redirect(302, `https://app.updraft.fund${pathname}${url.search}`);
}
