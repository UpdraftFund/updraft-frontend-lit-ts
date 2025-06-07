import { MaxPriorityQueue } from '@datastructures-js/priority-queue';
import { fromHex } from 'viem';

import { NewSupporters, NewFunders, Change } from '@/types';
import { updateSince } from '@state/user/tracked-changes';

// Get a unique ID for the change based on type and related entity
function getChangeId(change: Change): string {
  switch (change.type) {
    case 'newSupporter':
      return `idea-${change.idea.id}-newSupporter`;
    case 'newSolution':
      return `idea-${change.solution.idea.id}-solution-${change.solution.id}-newSolution`;
    case 'solutionUpdated':
      return `solution-${change.solution.id}-solutionUpdated`;
    case 'newFunder':
      return `solution-${change.solution.id}-newFunder`;
    case 'goalReached':
      return `solution-${change.solution.id}-goalReached`;
    case 'goalFailed':
      return `solution-${change.solution.id}-goalFailed`;
    default:
      return `unknown-${Date.now()}`;
  }
}

export class TrackedChangesManager {
  // Map to track changes by ID
  private changesMap = new Map<string, Change>();

  // Priority queue for ordering changes
  private changesQueue = new MaxPriorityQueue<Change>(
    (change: Change) => change.time
  );

  // Default target count
  private readonly targetCount: number = 10;

  constructor(targetCount: number = 10) {
    this.targetCount = targetCount;
  }

  /**
   * Process a new change, merging if necessary
   */
  addChange(change: Change): void {
    const changeId = getChangeId(change);
    const existingChange = this.changesMap.get(changeId);

    if (existingChange) {
      // For NewSupporters and NewFunders, merge
      if (
        change.type === 'newSupporter' &&
        existingChange.type === 'newSupporter'
      ) {
        this.mergeSupporter(
          existingChange as NewSupporters,
          change as NewSupporters
        );
        return;
      } else if (
        change.type === 'newFunder' &&
        existingChange.type === 'newFunder'
      ) {
        this.mergeFunder(existingChange as NewFunders, change as NewFunders);
        return;
      } else {
        // For other types, keep the existing one
        return;
      }
    }

    // Prepare and store new change
    let processedChange: Change;

    if (change.type === 'newSupporter') {
      const supporter = (change as NewSupporters).supporters[0];

      if (supporter.profile) {
        try {
          const profileData = JSON.parse(fromHex(supporter.profile, 'string'));
          supporter.name = profileData.name || profileData.team || supporter.id;
        } catch (e) {
          console.error('Error parsing profile data', e);
          supporter.name = supporter.id;
        }
      } else {
        supporter.name = supporter.id;
      }

      processedChange = {
        ...change,
        additionalCount: 0,
      } as NewSupporters;
    } else if (change.type === 'newFunder') {
      const funder = (change as NewFunders).funders[0];

      if (funder.profile) {
        try {
          const profileData = JSON.parse(fromHex(funder.profile, 'string'));
          funder.name = profileData.name || profileData.team || funder.id;
        } catch (e) {
          console.error('Error parsing profile data', e);
          funder.name = funder.id;
        }
      } else {
        funder.name = funder.id;
      }

      processedChange = {
        ...change,
        additionalCount: 0,
      } as NewFunders;
    } else {
      processedChange = { ...change };
    }

    this.changesMap.set(changeId, processedChange);
    this.changesQueue.enqueue(processedChange);
  }

  /**
   * Merge a new supporter into an existing NewSupporters change
   */
  private mergeSupporter(
    existingChange: NewSupporters,
    newChange: NewSupporters
  ): void {
    if (!existingChange.additionalCount) {
      existingChange.additionalCount = 0;
    }

    const newSupporter = newChange.supporters[0];

    // Only add distinct supporters up to 3
    const supporterNotFound = !existingChange.supporters.some(
      (supporter) => supporter.id === newSupporter.id
    );

    if (supporterNotFound && newSupporter.id) {
      if (existingChange.supporters.length < 3) {
        // If we need to show this supporter, extract the name from the profile
        if (newSupporter.profile) {
          try {
            const profileData = JSON.parse(
              fromHex(newSupporter.profile, 'string')
            );
            newSupporter.name =
              profileData.name || profileData.team || newSupporter.id;
          } catch (e) {
            console.error('Error parsing profile data', e);
            newSupporter.name = newSupporter.id;
          }
        } else {
          newSupporter.name = newSupporter.id;
        }

        existingChange.supporters.push(newSupporter);
      } else {
        // Just increment the count, no need to parse the profile
        existingChange.additionalCount++;
      }
    }

    // Update time if the new change is more recent
    if (newChange.time > existingChange.time) {
      existingChange.time = newChange.time;

      // Re-enqueue to update position in priority queue
      this.changesQueue.remove(
        (item) =>
          item.type === 'newSupporter' &&
          (item as NewSupporters).idea?.id === existingChange.idea?.id
      );
      this.changesQueue.enqueue(existingChange);
    }
  }

  private mergeFunder(existingChange: NewFunders, newChange: NewFunders): void {
    if (!existingChange.additionalCount) {
      existingChange.additionalCount = 0;
    }

    const newFunder = newChange.funders[0];

    // Only add distinct funders up to 3
    const funderNotFound = !existingChange.funders.some(
      (funder) => funder.id === newFunder.id
    );

    if (funderNotFound && newFunder.id) {
      if (existingChange.funders.length < 3) {
        // If we need to show this funder, extract the name from the profile
        if (newFunder.profile) {
          try {
            const profileData = JSON.parse(
              fromHex(newFunder.profile, 'string')
            );
            newFunder.name =
              profileData.name || profileData.team || newFunder.id;
          } catch (e) {
            console.error('Error parsing profile data', e);
            newFunder.name = newFunder.id;
          }
        } else {
          newFunder.name = newFunder.id;
        }

        existingChange.funders.push(newFunder);
      } else {
        // Just increment the count, no need to parse the profile
        existingChange.additionalCount++;
      }
    }

    // Update time if the new change is more recent
    if (newChange.time > existingChange.time) {
      existingChange.time = newChange.time;

      // Re-enqueue to update position in priority queue
      this.changesQueue.remove(
        (item) =>
          item.type === 'newFunder' &&
          (item as NewFunders).solution?.id === existingChange.solution?.id
      );
      this.changesQueue.enqueue(existingChange);
    }
  }

  /**
   * Get changes to render, limited to target count
   */
  getChangesToRender(): Change[] {
    // Convert queue to array for rendering
    const changesArray = this.changesQueue.toArray();

    // If we have more than the target count, update the "since" timestamp
    if (changesArray.length > this.targetCount) {
      const lastChange = changesArray[this.targetCount - 1];
      updateSince(Math.floor(lastChange.time / 1000));
      return changesArray.slice(0, this.targetCount);
    }

    return changesArray;
  }

  /**
   * Clear all stored changes
   */
  clear(): void {
    this.changesMap.clear();
    while (this.changesQueue.size() > 0) {
      this.changesQueue.dequeue();
    }
  }

  /**
   * Get the number of changes
   */
  size(): number {
    return this.changesQueue.size();
  }
}
