/**
 * Utility functions for managing document head meta tags for social media sharing
 * Supports Open Graph and Twitter Card meta tags
 */

import { Solution, Idea } from '@gql';
import { parseProfile } from '@utils/user/user-utils';
import { parseSolutionInfo } from '@utils/solution/solution-utils';

export interface MetaTagData {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'website' | 'article';
  siteName?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterSite?: string;
}

/**
 * Sets or updates a meta tag in the document head
 */
function setMetaTag(
  property: string,
  content: string,
  useProperty = true
): void {
  const attributeName = useProperty ? 'property' : 'name';
  let metaTag = document.querySelector(`meta[${attributeName}="${property}"]`);

  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute(attributeName, property);
    document.head.appendChild(metaTag);
  }

  metaTag.setAttribute('content', content);
}

/**
 * Sets the document title
 */
function setDocumentTitle(title: string): void {
  document.title = title;
}

/**
 * Sets Open Graph meta tags for social media sharing
 */
function setOpenGraphTags(data: MetaTagData): void {
  setMetaTag('og:title', data.title);
  setMetaTag('og:description', data.description);
  setMetaTag('og:url', data.url);
  setMetaTag('og:type', data.type || 'website');

  if (data.siteName) {
    setMetaTag('og:site_name', data.siteName);
  }

  if (data.image) {
    setMetaTag('og:image', data.image);
  }
}

/**
 * Sets Twitter Card meta tags for Twitter sharing
 */
function setTwitterCardTags(data: MetaTagData): void {
  setMetaTag('twitter:card', data.twitterCard || 'summary_large_image', false);
  setMetaTag('twitter:title', data.title, false);
  setMetaTag('twitter:description', data.description, false);

  if (data.twitterSite) {
    setMetaTag('twitter:site', data.twitterSite, false);
  }

  if (data.image) {
    setMetaTag('twitter:image', data.image, false);
  }
}

/**
 * Sets all social media meta tags for a page
 */
export function setSocialMediaTags(data: MetaTagData): void {
  // Set document title
  setDocumentTitle(data.title);

  // Set Open Graph tags
  setOpenGraphTags(data);

  // Set Twitter Card tags
  setTwitterCardTags(data);
}

/**
 * Clears social media meta tags and resets to defaults
 */
export function resetMetaTags(): void {
  const defaultData: MetaTagData = {
    title: 'Updraft',
    description: 'Get paid to crowdfund and work on public goods.',
    url: window.location.origin,
    type: 'website',
    siteName: 'Updraft',
    twitterCard: 'summary_large_image',
    twitterSite: '@updraftfund',
  };

  setSocialMediaTags(defaultData);
}

/**
 * Generates meta tags for an idea page
 */
export function setIdeaMetaTags(idea: Idea): void {
  // Parse creator profile to get display name
  const profile = parseProfile(idea.creator.profile as `0x${string}`);
  const creatorName = profile.name || profile.team || idea.creator.id;

  const title = `${idea.name} | Updraft`;
  const description =
    idea.description && idea.description.trim()
      ? `${idea.description.substring(0, 200)}${idea.description.length > 200 ? '...' : ''} - Created by ${creatorName}`
      : `An idea created by ${creatorName} on Updraft - Get paid to crowdfund and work on public goods.`;

  const url = `${window.location.origin}/idea/${idea.id}`;

  setSocialMediaTags({
    title,
    description,
    url,
    type: 'article',
    siteName: 'Updraft',
    twitterCard: 'summary_large_image',
    twitterSite: '@updraftfund',
  });
}

/**
 * Generates meta tags for a solution page
 */
export function setSolutionMetaTags(solution: Solution): void {
  // Parse drafter profile to get display name
  const profile = parseProfile(solution.drafter.profile as `0x${string}`);
  const drafterName = profile.name || profile.team || solution.drafter.id;

  // Parse solution info to get name and description
  const solutionInfo = parseSolutionInfo(solution.info);
  const solutionName = solutionInfo.name || 'Untitled Solution';
  const solutionDescription = solutionInfo.description || '';

  const ideaContext = ` for "${solution.idea.name}"`;

  const title = `${solutionName} | Updraft`;
  const description = solutionDescription
    ? `${solutionDescription.substring(0, 200)}${solutionDescription.length > 200 ? '...' : ''} - Solution${ideaContext} by ${drafterName}`
    : `A solution${ideaContext} by ${drafterName} on Updraft - Get paid to crowdfund and work on public goods.`;

  const url = `${window.location.origin}/solution/${solution.id}`;

  setSocialMediaTags({
    title,
    description,
    url,
    type: 'article',
    siteName: 'Updraft',
    twitterCard: 'summary_large_image',
    twitterSite: '@updraftfund',
  });
}
