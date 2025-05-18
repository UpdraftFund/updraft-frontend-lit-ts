import { Profile } from '@/types/user/profile';
import { fromHex } from 'viem';

/**
 * Parses a profile from a hex-encoded JSON string
 * @param profileHex The hex-encoded profile string
 * @returns Parsed profile object or default profile if parsing fails
 */
export function parseProfile(profileHex: `0x${string}` | undefined): Profile {
  if (profileHex) {
    try {
      return JSON.parse(fromHex(profileHex, 'string'));
    } catch (e) {
      console.error('Error parsing profile', e);
    }
  }
  return {};
}
