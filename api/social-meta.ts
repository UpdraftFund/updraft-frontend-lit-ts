// Vercel Edge Function for social media meta tags
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Social media crawler user agents
const CRAWLER_USER_AGENTS = [
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'telegrambot',
  'whatsapp',
  'skypeuripreview',
  'applebot',
  'googlebot',
  'bingbot',
  'yandexbot',
  'pinterest',
  'redditbot',
  'mastodon',
  'misskey',
  'pleroma',
];

// GraphQL queries
const IDEA_QUERY = `
  query Idea($ideaId: ID!) {
    idea(id: $ideaId) {
      id
      name
      description
      creator {
        id
        profile
      }
    }
  }
`;

const SOLUTION_QUERY = `
  query Solution($solutionId: ID!) {
    solution(id: $solutionId) {
      id
      info
      drafter {
        id
        profile
      }
      idea {
        id
        name
      }
    }
  }
`;

interface IdeaData {
  id: string;
  name?: string;
  description?: string;
  creator: {
    id: string;
    profile?: string;
  };
}

interface SolutionData {
  id: string;
  info?: string;
  drafter: {
    id: string;
    profile?: string;
  };
  idea: {
    id: string;
    name?: string;
  };
}

interface Profile {
  name?: string;
  team?: string;
}

interface SolutionInfo {
  name?: string;
  description?: string;
}

/**
 * Checks if the request is from a social media crawler
 */
function isCrawlerRequest(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some((crawler) => ua.includes(crawler));
}

/**
 * Parses a profile from a hex-encoded JSON string
 */
function parseProfile(profileHex: string | undefined): Profile {
  if (profileHex) {
    try {
      // Handle hex-encoded profile data
      const profileString = profileHex.startsWith('0x')
        ? Buffer.from(profileHex.slice(2), 'hex').toString('utf8')
        : profileHex;
      return JSON.parse(profileString);
    } catch (e) {
      console.error('Error parsing profile', e);
    }
  }
  return {};
}

/**
 * Parses solution info from a hex-encoded JSON string
 */
function parseSolutionInfo(infoHex: string | undefined): SolutionInfo {
  if (infoHex) {
    try {
      // Handle hex-encoded info data
      const infoString = infoHex.startsWith('0x')
        ? Buffer.from(infoHex.slice(2), 'hex').toString('utf8')
        : infoHex;
      return JSON.parse(infoString);
    } catch (e) {
      console.error('Error parsing solution info', e);
    }
  }
  return {
    name: 'Untitled Solution',
    description: '',
  };
}

/**
 * Fetches data from The Graph API
 */
async function fetchGraphQLData(
  query: string,
  variables: Record<string, unknown>
): Promise<{ idea?: IdeaData; solution?: SolutionData } | null> {
  const graphApiKey = process.env.VITE_GRAPH_API_KEY;
  const graphUrl =
    'https://gateway.thegraph.com/api/subgraphs/id/AX96zuXixk4ugPQG7CDypy1EdRnYE4Z9khjk2fpzHfAq';

  if (!graphApiKey) {
    console.error('Missing VITE_GRAPH_API_KEY environment variable');
    return null;
  }

  try {
    const response = await fetch(graphUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${graphApiKey}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      console.error(
        'GraphQL request failed:',
        response.status,
        response.statusText
      );
      return null;
    }

    const result = await response.json();

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching GraphQL data:', error);
    return null;
  }
}

/**
 * Escapes HTML characters to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Generates meta tags for an idea
 */
function generateIdeaMetaTags(idea: IdeaData, url: string): string {
  const profile = parseProfile(idea.creator.profile);
  const creatorName = profile.name || profile.team || idea.creator.id;

  const title = `${idea.name || 'Untitled Idea'} | Updraft`;
  const description =
    idea.description && idea.description.trim()
      ? `${idea.description.substring(0, 200)}${idea.description.length > 200 ? '...' : ''} - Created by ${creatorName}`
      : `An idea created by ${creatorName} on Updraft - Get paid to crowdfund and work on public goods.`;

  return generateMetaTags(title, description, url);
}

/**
 * Generates meta tags for a solution
 */
function generateSolutionMetaTags(solution: SolutionData, url: string): string {
  const profile = parseProfile(solution.drafter.profile);
  const drafterName = profile.name || profile.team || solution.drafter.id;

  const solutionInfo = parseSolutionInfo(solution.info);
  const solutionName = solutionInfo.name || 'Untitled Solution';
  const solutionDescription = solutionInfo.description || '';

  const ideaContext = ` for "${solution.idea.name || 'Unknown Idea'}"`;

  const title = `${solutionName} | Updraft`;
  const description = solutionDescription
    ? `${solutionDescription.substring(0, 200)}${solutionDescription.length > 200 ? '...' : ''} - Solution${ideaContext} by ${drafterName}`
    : `A solution${ideaContext} by ${drafterName} on Updraft - Get paid to crowdfund and work on public goods.`;

  return generateMetaTags(title, description, url);
}

/**
 * Generates the meta tags HTML
 */
function generateMetaTags(
  title: string,
  description: string,
  url: string
): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(description)}" />
    
    <!-- Open Graph meta tags -->
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:site_name" content="Updraft" />
    <meta property="og:image" content="https://www.updraft.fund/assets/updraft-icon.png" />
    
    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@updraftfund" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="https://www.updraft.fund/assets/updraft-icon.png" />
    
    <title>${escapeHtml(title)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userAgent = req.headers['user-agent'] || '';
  const { type, id } = req.query;

  // Only process for social media crawlers
  if (!isCrawlerRequest(userAgent)) {
    return res.redirect(302, `/${type}/${id}`);
  }

  if (type === 'idea' && typeof id === 'string') {
    const data = await fetchGraphQLData(IDEA_QUERY, { ideaId: id });

    if (data?.idea) {
      const html = generateIdeaMetaTags(
        data.idea,
        `${req.headers.host}/${type}/${id}`
      );
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.send(html);
    }
  }

  if (type === 'solution' && typeof id === 'string') {
    const data = await fetchGraphQLData(SOLUTION_QUERY, { solutionId: id });

    if (data?.solution) {
      const html = generateSolutionMetaTags(
        data.solution,
        `${req.headers.host}/${type}/${id}`
      );
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.send(html);
    }
  }

  // Fallback: redirect to the normal SPA
  return res.redirect(302, `/${type}/${id}`);
}
