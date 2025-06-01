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

### Files Created/Modified

1. **`src/features/common/utils/meta-utils.ts`** - New utility functions for managing meta tags
2. **`src/features/pages/idea-page.ts`** - Updated to set meta tags when idea data loads
3. **`src/features/pages/solution-page.ts`** - Updated to set meta tags when solution data loads
4. **`index.html`** - Added default Open Graph and Twitter Card meta tags
5. **`src/features/common/utils/meta-utils.test.ts`** - Tests for the meta utils functions

### Key Functions

#### `setIdeaMetaTags(ideaData)`

Sets social media meta tags for an idea page with:

- Idea name as title
- Idea description (if available) with creator attribution
- Creator name parsed from profile data
- Canonical URL for the idea

#### `setSolutionMetaTags(solutionData)`

Sets social media meta tags for a solution page with:

- Solution name as title
- Solution description (if available) with drafter attribution
- Drafter name parsed from profile data
- Reference to the linked idea (if available)
- Canonical URL for the solution

#### `clearSocialMediaTags()`

Resets meta tags to default Updraft values when navigating away from content pages.

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

The meta tags are automatically set when:

1. Users navigate to an idea page (`/idea/:id`)
2. Users navigate to a solution page (`/solution/:id`)
3. The GraphQL data for the idea/solution loads successfully

The meta tags are automatically cleared when:

1. Users navigate away from idea/solution pages
2. Components are disconnected

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
