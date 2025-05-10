/**
 * Utility functions for sorting ideas
 */
import { Idea } from '@/types';

/**
 * Sorts an array of ideas by startTime (newest first) and returns a slice of the sorted array
 * @param ideas - Array of ideas to sort
 * @param count - Number of ideas to return (default: all ideas)
 * @returns Sorted array of ideas (newest first), limited to count if specified
 */
export function sortIdeasByNewest(ideas: Idea[], count?: number): Idea[] {
  // Sort ideas by startTime in descending order (newest first)
  const sortedIdeas = [...ideas].sort((a, b) => {
    // Convert BigInt strings to numbers for comparison
    const aTime = Number(a.startTime);
    const bTime = Number(b.startTime);
    return bTime - aTime; // Descending order (newest first)
  });

  // Return all sorted ideas if count is not specified
  if (count === undefined) {
    return sortedIdeas;
  }

  // Return a slice of the sorted ideas up to the specified count
  return sortedIdeas.slice(0, count);
}
