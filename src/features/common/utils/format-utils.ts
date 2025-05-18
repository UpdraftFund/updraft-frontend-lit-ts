import { formatUnits } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { updraftSettings } from '@state/common';

/**
 * Regular expression pattern for validating Ethereum addresses
 * Matches a 0x prefix followed by exactly 40 hexadecimal characters
 */
export const ethAddressPattern = /^0x[a-fA-F0-9]{40}$/;

/**
 * Shortens an Ethereum address for display purposes
 * @param address The full Ethereum address
 * @returns A shortened version of the address (e.g., 0x1234...5678)
 */
export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Formats a funder reward percentage from the raw value
 * @param funderReward The raw funder reward value
 * @returns Formatted percentage string with 0 decimal places
 */
export function formatReward(funderReward: number): string {
  const pctFunderReward =
    (funderReward * 100) / updraftSettings.get().percentScale;
  return `${pctFunderReward.toFixed(0)}%`;
}

/**
 * Formats a token amount for display
 * @param amount The token amount as a bigint
 * @returns Formatted token amount string
 */
export function formatAmount(amount: bigint): string {
  if (!amount) return '0';
  return shortNum(formatUnits(amount, 18));
}

/**
 * Formats a date for display in a consistent way
 * @param timestamp Unix timestamp in seconds
 * @param format The format to use (fromNow, formatted, full)
 * @returns formatted date string
 */
export function formatDate(timestamp: number, format: string) {
  const date = dayjs(timestamp * 1000);
  switch (format) {
    case 'fromNow':
      return date.fromNow();
    case 'withTime':
      return date.format('MMM D, YYYY [at] h:mm A');
    case 'full':
      return `${date.format('MMM D, YYYY [at] h:mm A')} (${date.fromNow()})`;
    default:
      return date.format('MMM D, YYYY');
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

/**
 * Formats a number with appropriate suffixes (K, M, B, etc.) for display
 * @param n The number to format
 * @param p Precision (default: 3)
 * @param e Exponent precision (default: p-3)
 * @returns Formatted number string
 */
export const shortNum = function (n: string | number, p = 3, e = p - 3) {
  n = Number(n);
  if (n === 0) return '0';

  let ans;
  const absn = Math.abs(n);

  if (absn < Math.pow(10, -1 * p) || absn >= 10 ** 18) {
    ans = n.toExponential(Math.max(e, 0));
  } else if (absn < 1) {
    ans = n.toFixed(p);
  } else {
    const suffixes = ['', 'K', 'M', 'B', 'T', 'Q'];
    let index = Math.floor(Math.log10(absn) / 3);
    let scaled = n / 10 ** (index * 3);
    if (Math.round(scaled * 10 ** (p - 3)) == 10 ** p) {
      ++index;
      scaled = 1;
    }
    ans = scaled.toPrecision(p) + suffixes[index];
  }
  ans = ans.replace(/\.0+(\D|$)/, '$1');
  return ans.replace(/(\.\d*?)0+(\D|$)/, '$1$2');
};
