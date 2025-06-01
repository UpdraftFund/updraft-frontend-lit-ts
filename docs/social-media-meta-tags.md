# Social Media Meta Tags Implementation

This document describes the implementation of Open Graph and Twitter Card meta tags for attractive social media sharing
of Updraft idea and solution pages.

## Overview

When users share links to Updraft ideas and solutions on social media platforms (Twitter, Facebook, LinkedIn, etc.), the
links now display rich previews with:

- **Title**: The idea/solution name with "| Updraft" suffix
- **Description**: The idea/solution description with creator/drafter attribution
- **URL**: The canonical URL of the page
- **Image**: Updraft logo (can be enhanced with custom images later)
- **Type**: Marked as "article" for content pages, "website" for general pages

## Implementation Details

### Server-Side Implementation (Primary)

**Social media crawlers cannot execute JavaScript**, so the primary implementation uses **Vercel Edge Functions** to
generate meta tags server-side:

1. **`api/_middleware.ts`** - Edge function middleware that detects social media crawlers and routes requests
2. **`api/idea-meta.ts`** - Handler for generating idea page meta tags server-side
3. **`api/solution-meta.ts`** - Handler for generating solution page meta tags server-side
4. **`index.html`** - Updated with default Open Graph and Twitter Card meta tags

### How It Works

#### Crawler Detection

The middleware detects social media crawlers by checking the User-Agent header against a list of known crawler patterns:

- `facebookexternalhit` (Facebook)
- `twitterbot` (Twitter/X)
- `linkedinbot` (LinkedIn)
- `slackbot` (Slack)
- `discordbot` (Discord)
- And many others...

#### Dynamic Meta Tag Generation

When a crawler requests `/idea/:id` or `/solution/:id`:

1. The middleware extracts the ID from the URL
2. Makes a GraphQL query to The Graph API to fetch the data
3. Generates appropriate meta tags with the fetched data
4. Returns modified HTML with the meta tags injected

#### Regular User Experience

Regular users (non-crawlers) continue to receive the normal SPA experience with client-side routing.

### Key Features

#### Idea Pages

- **Title**: `"[Idea Name] | Updraft"`
- **Description**: Idea description + creator attribution, or fallback message
- **Creator**: Name extracted from profile data (name/team/address)
- **URL**: Canonical URL for the idea

#### Solution Pages

- **Title**: `"[Solution Name] | Updraft"`
- **Description**: Solution description + drafter attribution + idea context
- **Drafter**: Name extracted from profile data
- **Idea Context**: Reference to the linked idea
- **URL**: Canonical URL for the solution

### Data Handling

The implementation properly handles:

- **Hex-encoded data**: Profile and solution info data is decoded from hex format
- **Missing data**: Graceful fallbacks for undefined/null descriptions and profiles
- **JSON parsing errors**: Safe parsing with fallbacks to default values
- **Profile extraction**: Extracts display names from user profiles (name, team, or address)

### Meta Tags Set

#### Open Graph Tags

- `og:title` - Page title
- `og:description` - Page description
- `og:type` - Content type (article/website)
- `og:url` - Canonical URL
- `og:site_name` - "Updraft"
- `og:image` - Updraft logo

#### Twitter Card Tags

- `twitter:card` - "summary_large_image"
- `twitter:site` - "@updraftfund"
- `twitter:title` - Page title
- `twitter:description` - Page description
- `twitter:image` - Updraft logo

## Usage

The meta tags are automatically generated when:

1. Social media crawlers request an idea page (`/idea/:id`)
2. Social media crawlers request a solution page (`/solution/:id`)
3. The Edge Function successfully fetches data from The Graph API

Regular users continue to use the normal SPA without any changes to their experience.

## Testing

You can test the social media previews using:

### Official Validators

- [Twitter Card Validator](https://cards-dev.twitter.com/validator) (requires Twitter login)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) (requires Facebook login)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/) (requires LinkedIn login)

### Unofficial Tools

- [Open Graph Debugger](https://en.rakko.tools/tools/9/) (no login required)

## Future Enhancements

Potential improvements for the future:

1. **Custom Images**: Generate or use custom preview images for ideas/solutions
2. **Rich Snippets**: Add structured data for better search engine understanding
3. **Dynamic Images**: Create dynamic preview images with idea/solution details
4. **Analytics**: Track social media referrals and engagement
5. **Platform-Specific Optimization**: Tailor content for different social platforms

## Example Output

When sharing an idea link, social media platforms will display:

**Title**: "Build a Decentralized Social Network | Updraft"
**Description**: "A platform for connecting people without centralized control over data and content. Users own their
data and can migrate between compatible platforms. - Created by Alice"
**URL**: "https://www.updraft.fund/idea/0x123..."
**Image**: Updraft logo

When sharing a solution link:

**Title**: "Mastodon Integration Solution | Updraft"
**Description**: "Implementation of ActivityPub protocol to enable federation with existing decentralized social
networks like Mastodon and Pleroma. - Solution for \"Build a Decentralized Social Network\" by Bob"
**URL**: "https://www.updraft.fund/solution/0x456..."
**Image**: Updraft logo
