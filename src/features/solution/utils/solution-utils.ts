import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { Solution } from '@/types';

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
