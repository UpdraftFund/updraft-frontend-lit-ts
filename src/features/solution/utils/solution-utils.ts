import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { Solution } from '@/types';

/**
 * Calculates progress percentage from a solution object
 * @param solution Solution object with tokensContributed and fundingGoal properties
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(solution?: Solution): number;
/**
 * Calculates progress percentage from funding and goal values
 * @param funding Current funding amount
 * @param goal Funding goal amount
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(funding: bigint, goal: bigint): number;

export function calculateProgress(
  solutionOrFunding?: Solution | bigint,
  goal?: bigint
): number {
  // If first argument is a Solution object
  if (solutionOrFunding && typeof solutionOrFunding === 'object') {
    const solution = solutionOrFunding;
    if (solution.totalFunding && solution.fundingGoal) {
      return Math.min(
        Number(solution.totalFunding / solution.fundingGoal) * 100,
        100
      );
    }
    return 0;
  }
  
  // If first argument is a bigint (funding amount)
  if (solutionOrFunding !== undefined && goal !== undefined) {
    const funding = solutionOrFunding as bigint;
    if (goal === 0n) return 0;
    return Math.min(Number((funding * 100n) / goal), 100);
  }
  
  return 0;
}

export function goalReached(solution?: Solution) {
  if (solution) {
    return BigInt(solution.totalFunding) >= BigInt(solution.fundingGoal);
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
