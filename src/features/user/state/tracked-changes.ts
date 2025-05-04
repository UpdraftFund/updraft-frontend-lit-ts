import { signal } from '@lit-labs/signals';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// Get default value from localStorage or 1 day ago as Unix timestamp.
function getDefaultSinceValue(): number {
  const storedValue = localStorage.getItem('tracked-changes-since');
  if (storedValue && !isNaN(Number(storedValue))) {
    return Number(storedValue);
  }
  resetSince();
  return since.get();
}

export const since = signal(getDefaultSinceValue());

// Update the signal and localStorage.
export function updateSince(value: number) {
  since.set(value);
  localStorage.setItem('tracked-changes-since', value.toString());
}

export function resetSince() {
  const oneDayAgo = dayjs().subtract(1, 'day').unix();
  since.set(oneDayAgo);
  localStorage.setItem('tracked-changes-since', oneDayAgo.toString());
}
