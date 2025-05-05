import { signal } from '@lit-labs/signals';
import { markComplete } from './beginner-tasks';

const storedTags: string[] = JSON.parse(
  localStorage.getItem('watchedTags') || '[]'
);
const tagSet = new Set<string>(storedTags);
export const watchedTags = signal<Set<string>>(tagSet);

export const watchTag = (tag: string) => {
  const currentTags = watchedTags.get();
  if (!currentTags.has(tag)) {
    // Only update if the tag isn't already present
    const updatedTags = new Set(currentTags);
    updatedTags.add(tag);
    watchedTags.set(updatedTags);
    localStorage.setItem('watchedTags', JSON.stringify([...updatedTags]));
  }
  markComplete('watch-tag');
};

export const unwatchTag = (tag: string) => {
  const currentTags = watchedTags.get();
  if (currentTags.has(tag)) {
    // Only update if the tag exists
    const updatedTags = new Set(currentTags);
    updatedTags.delete(tag);
    watchedTags.set(updatedTags);
    localStorage.setItem('watchedTags', JSON.stringify([...updatedTags]));
  }
};

export const isWatched = (tag: string) => {
  return watchedTags.get().has(tag);
};
