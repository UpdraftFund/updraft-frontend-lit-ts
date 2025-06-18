/**
 * Shared formatting utilities that work in both browser and Node.js environments
 * These utilities have no browser-specific dependencies
 */

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

/**
 * Capitalizes the first letter of a string
 * @param s The string to capitalize
 * @returns The capitalized string
 */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
 * Regular expression pattern for validating Ethereum addresses
 * Matches a 0x prefix followed by exactly 40 hexadecimal characters
 */
export const ethAddressPattern = /^0x[a-fA-F0-9]{40}$/;

/**
 * Escapes characters that could break HTML attribute values
 * Handles both user input and content that may already contain HTML entities
 */
export function escapeForAttribute(text: string): string {
  return (
    text
      // First escape any unescaped ampersands (must be done first)
      .replace(/&(?![a-zA-Z0-9#]+;)/g, '&amp;')
      // Then escape any unescaped quotes
      .replace(/"/g, '&quot;')
  );
}
