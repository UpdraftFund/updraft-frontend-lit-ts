# Edge Functions for Social Media Meta Tags

This document describes the Vercel Edge Functions implementation for generating dynamic social media meta tags for
Updraft idea and solution pages.

## Overview

Social media platforms (Twitter, Facebook, LinkedIn, etc.) use web crawlers to fetch page content when users share
links. These crawlers **cannot execute JavaScript**, so they only see the static HTML served by the server. To provide
rich social media previews, we need to inject the appropriate meta tags server-side.

## Implementation

### Edge Function (`middleware.ts`)

The edge function runs at Vercel's edge locations and:

1. **Detects social media crawlers** by checking User-Agent headers
2. **Extracts idea/solution IDs** from URL paths (`/idea/:id` or `/solution/:id`)
3. **Fetches data** from The Graph API using GraphQL queries
4. **Generates dynamic HTML** with appropriate Open Graph and Twitter Card meta tags
5. **Returns the modified HTML** to crawlers while letting regular users get the normal SPA

### Crawler Detection

The middleware detects requests from these social media crawlers:

- Facebook (`facebookexternalhit`)
- Twitter (`twitterbot`)
- LinkedIn (`linkedinbot`)
- Slack (`slackbot`)
- Discord (`discordbot`)
- Telegram (`telegrambot`)
- WhatsApp (`whatsapp`)
- And many others...

### Data Fetching

For each page type, the edge function makes GraphQL queries to The Graph API:

**Idea Pages:**

```graphql
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
```

**Solution Pages:**

```graphql
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
```

### Meta Tag Generation

The edge function generates comprehensive meta tags:

#### Open Graph Tags

- `og:title` - Page title with "| Updraft" suffix
- `og:description` - Content description with creator/drafter attribution
- `og:type` - "article" for content pages
- `og:url` - Canonical URL
- `og:site_name` - "Updraft"
- `og:image` - Updraft logo

#### Twitter Card Tags

- `twitter:card` - "summary_large_image"
- `twitter:site` - "@updraftfund"
- `twitter:title` - Same as Open Graph title
- `twitter:description` - Same as Open Graph description
- `twitter:image` - Updraft logo

## Configuration

### Environment Variables

The edge function requires:

- `VITE_GRAPH_API_KEY` - API key for The Graph API access
- `VITE_APP_ENV` - Environment setting that controls which subgraph to use:
    - Empty or 'preview': Uses Arbitrum Sepolia subgraph
    - 'production': Uses Arbitrum One subgraph

### Vercel Configuration (`vercel.json`)

```json
{
    "functions": {
        "middleware.ts": {
            "runtime": "edge"
        }
    },
    "rewrites": [
        {
            "source": "/(.*)",
            "destination": "/index.html"
        }
    ]
}
```

## Performance & Caching

- **Edge Runtime**: Functions run at Vercel's edge locations for low latency
- **Caching**: Responses are cached for 5 minutes (`Cache-Control: public, max-age=300`)
- **Fallback**: If data fetching fails, the function falls back to the normal SPA response
- **Selective Processing**: Only processes requests from detected crawlers

## Cost Estimation

Based on Vercel Edge Functions pricing:

### Free Tier (Hobby Plan)

- **1 million invocations/month** - FREE
- **100 GB-hours execution time/month** - FREE

### Realistic Usage

- **10,000 social media crawls/month**: $0 (within free tier)
- **100,000 social media crawls/month**: $0 (still within free tier)
- **2 million social media crawls/month**: ~$2 (1M free + 1M at $2/million)

Most projects will stay within the free tier since only social media crawlers trigger these functions.

## Example Output

When a social media platform crawls an idea link, it receives HTML like:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

    <!-- Open Graph meta tags -->
    <meta property="og:title" content="Build a Decentralized Social Network | Updraft"/>
    <meta property="og:description"
          content="A platform for connecting people without centralized control over data and content. Users own their data and can migrate between compatible platforms. - Created by Alice"/>
    <meta property="og:type" content="article"/>
    <meta property="og:url" content="https://www.updraft.fund/idea/0x123..."/>
    <meta property="og:site_name" content="Updraft"/>
    <meta property="og:image" content="https://www.updraft.fund/assets/updraft-icon.png"/>

    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary_large_image"/>
    <meta name="twitter:site" content="@updraftfund"/>
    <meta name="twitter:title" content="Build a Decentralized Social Network | Updraft"/>
    <meta name="twitter:description" content="A platform for connecting people without centralized control..."/>
    <meta name="twitter:image" content="https://www.updraft.fund/assets/updraft-icon.png"/>

    <title>Build a Decentralized Social Network | Updraft</title>
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.ts"></script>
</body>
</html>
```

## Testing

You can test the social media previews using:

### Official Validators

- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

### Unofficial Tools

- [Open Graph Debugger](https://en.rakko.tools/tools/9/) (no login required)

### Manual Testing

You can test the edge function by making requests with crawler User-Agent headers:

```bash
curl -H "User-Agent: facebookexternalhit/1.1" https://your-domain.com/idea/0x123...
```

## Deployment

The edge function is automatically deployed with your Vercel project. Make sure to:

1. Set the `VITE_GRAPH_API_KEY` environment variable in Vercel
2. Deploy the updated `middleware.ts` and `vercel.json` files
3. Test with social media validators after deployment

## Benefits

- **Rich Social Media Previews**: Links shared on social media show attractive previews
- **SEO Improvement**: Better meta tags improve search engine understanding
- **No Performance Impact**: Only affects crawler requests, not regular users
- **Cost Effective**: Most usage stays within Vercel's free tier
- **Scalable**: Runs at edge locations for global performance
