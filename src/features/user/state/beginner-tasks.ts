import { signal, computed } from '@lit-labs/signals';

export const BEGINNER_TASKS = [
  'follow-someone',
  'watch-tag',
  'connect-wallet',
  // 'get-gas',
  'get-upd',
  'support-idea',
  'fund-solution',
  'create-profile',
] as const;

export type BeginnerTask = (typeof BEGINNER_TASKS)[number];

export const BEGINNER_TASKS_COUNT = BEGINNER_TASKS.length;

const storedTasks: BeginnerTask[] = JSON.parse(
  localStorage.getItem('completedTasks') || '[]'
);
const tasksSet = new Set<BeginnerTask>(storedTasks);
export const completedTasks = signal<Set<BeginnerTask>>(tasksSet);

export const allTasksComplete = computed(() => {
  return completedTasks.get().size === BEGINNER_TASKS_COUNT;
});

export const markComplete = (taskId: BeginnerTask): void => {
  if (isComplete(taskId)) return; // avoid unnecessary rerenders

  const updatedTasks = new Set(completedTasks.get());
  updatedTasks.add(taskId);
  completedTasks.set(updatedTasks);
  localStorage.setItem('completedTasks', JSON.stringify([...updatedTasks]));

  // Set cross-subdomain cookie to indicate user has used the app
  // This allows www.updraft.fund to know they're not a new user
  try {
    document.cookie =
      'hasUsedApp=true; domain=.updraft.fund; path=/; max-age=31536000; SameSite=Lax';
  } catch (error) {
    console.warn('Failed to set cross-subdomain cookie:', error);
  }
};

export const isComplete = (taskId: BeginnerTask) => {
  return completedTasks.get().has(taskId);
};

export const reset = (): void => {
  completedTasks.set(new Set());
  try {
    localStorage.removeItem('completedTasks');
  } catch (error) {
    console.warn('Failed to clear completed tasks from local storage:', error);
  }
};
