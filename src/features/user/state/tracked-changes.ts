import { signal } from '@lit-labs/signals';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

function getDefaultSinceValue(): number {
  const storedValue = localStorage.getItem('tracked-changes-since');
  if (storedValue && !isNaN(Number(storedValue))) {
    return Number(storedValue);
  }
  const oneDayAgo = dayjs().subtract(1, 'day').unix();
  localStorage.setItem('tracked-changes-since', oneDayAgo.toString());
  return oneDayAgo;
}

export const since = signal(getDefaultSinceValue());

export function updateSince(unixTimestamp: number) {
  since.set(unixTimestamp);
  localStorage.setItem('tracked-changes-since', unixTimestamp.toString());
}
