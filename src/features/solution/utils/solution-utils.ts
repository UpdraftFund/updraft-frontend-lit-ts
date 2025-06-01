import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { fromHex } from 'viem';
import { Solution, SolutionInfo } from '@/types';

/**
 * Parses solution info from a hex-encoded JSON string
 * @param infoHex The hex-encoded solution info string
 * @returns Parsed solution info object or default values if parsing fails
 */
export function parseSolutionInfo(
  infoHex: `0x${string}` | string | undefined
): SolutionInfo {
  if (infoHex) {
    try {
      // Handle hex-encoded info data
      const infoString = infoHex.startsWith('0x')
        ? fromHex(infoHex as `0x${string}`, 'string')
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
 * Calculates progress percentage from a solution object
 * @param solution Solution object with tokensContributed and fundingGoal properties
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(solution?: Solution): number {
  if (solution && solution.tokensContributed && solution.fundingGoal) {
    return Math.min(
      Number(solution.tokensContributed / solution.fundingGoal) * 100,
      100
    );
  } else {
    return 0;
  }
}

export function goalReached(solution?: Solution) {
  if (solution) {
    return BigInt(solution.tokensContributed) >= BigInt(solution.fundingGoal);
  }
  return false;
}

export function goalFailed(solution?: Solution) {
  if (solution) {
    const now = dayjs();
    const deadline = dayjs(solution.deadline * 1000);
    return now.isAfter(deadline) && !goalReached(solution);
  }
  return false;
}
