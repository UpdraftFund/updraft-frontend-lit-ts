import { signal } from '@lit-labs/signals';

const storedUsers: string[] = JSON.parse(
  localStorage.getItem('followedUsers') || '[]'
);
const userSet = new Set<string>(storedUsers);
export const followedUsers = signal<Set<string>>(userSet);

export const followUser = (user: string) => {
  const currentUsers = followedUsers.get();
  if (!currentUsers.has(user)) {
    // Only update if the user isn't already present
    const updatedUsers = new Set(currentUsers);
    updatedUsers.add(user);
    followedUsers.set(updatedUsers);
    localStorage.setItem('followedUsers', JSON.stringify([...updatedUsers]));
  }
};

export const unfollowUser = (user: string) => {
  const currentUsers = followedUsers.get();
  if (currentUsers.has(user)) {
    // Only update if the user exists
    const updatedUsers = new Set(currentUsers);
    updatedUsers.delete(user);
    followedUsers.set(updatedUsers);
    localStorage.setItem('followedUsers', JSON.stringify([...updatedUsers]));
  }
};

export const isFollowed = (user: string) => {
  return followedUsers.get().has(user);
};
