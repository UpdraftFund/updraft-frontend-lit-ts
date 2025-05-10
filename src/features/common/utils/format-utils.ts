import { formatUnits, fromHex } from 'viem';
import dayjs from 'dayjs';
import { updraftSettings } from '@state/common';
import { shortNum } from '@utils/short-num';
import { Profile } from '@/features/user/types';

/**
 * Formats a funder reward percentage from the raw value
 * @param funderReward The raw funder reward value
 * @returns Formatted percentage string with 0 decimal places
 */
export function formatFunderReward(funderReward: number): string {
  const pctFunderReward =
    (funderReward * 100) / updraftSettings.get().percentScale;
  return `${pctFunderReward.toFixed(0)}%`;
}

/**
 * Formats a token amount for display
 * @param amount The token amount as a bigint or string
 * @returns Formatted token amount string
 */
export function formatTokenAmount(amount: bigint): string {
  return shortNum(formatUnits(amount, 18));
}

/**
 * Parses a profile from a hex-encoded JSON string
 * @param profileHex The hex-encoded profile string
 * @returns Parsed profile object or default profile if parsing fails
 */
export function parseProfile(profileHex: `0x${string}` | undefined): Profile {
  if (!profileHex) {
    return { name: '', team: '' };
  }

  try {
    return JSON.parse(fromHex(profileHex, 'string'));
  } catch (e) {
    console.error('Error parsing profile', e);
    return { name: '', team: '' };
  }
}

/**
 * Formats a date for display in a consistent way
 * @param timestamp Unix timestamp in seconds
 * @returns Object with different formatted date strings
 */
export function formatDate(timestamp: number) {
  const date = dayjs(timestamp * 1000);

  return {
    fromNow: date.fromNow(),
    formatted: date.format('MMM D, YYYY [at] h:mm A UTC'),
    full: `${date.format('MMM D, YYYY [at] h:mm A UTC')} (${date.fromNow()})`,
  };
}

/**
 * Calculates progress percentage
 * @param current Current value
 * @param goal Goal value
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(
  current: bigint | string | undefined,
  goal: bigint | string | undefined
): number {
  if (current && goal) {
    const currentBigInt =
      typeof current === 'string' ? BigInt(current) : current;
    const goalBigInt = typeof goal === 'string' ? BigInt(goal) : goal;

    if (goalBigInt === 0n) return 0;
    return Number((currentBigInt * 100n) / goalBigInt);
  } else {
    return 0;
  }
}

/**
 * Capitalizes the first letter of a string
 * @param s The string to capitalize
 * @returns The capitalized string
 */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
