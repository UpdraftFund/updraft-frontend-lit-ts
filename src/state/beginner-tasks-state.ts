import { signal, computed } from '@lit-labs/signals';

export const BEGINNER_TASKS = [
  'follow-someone',
  'watch-tag',
  'connect-wallet',
  'get-gas',
  'get-upd',
  'support-idea',
  'fund-solution',
  'create-profile',
] as const;

const isBeginnerTask = (task: string): task is BeginnerTask => {
  return BEGINNER_TASKS.includes(task as BeginnerTask);
};

export const BEGINNER_TASKS_COUNT = BEGINNER_TASKS.length;

export const STORAGE_KEY = 'completedBeginnerTasks';

export type BeginnerTask = (typeof BEGINNER_TASKS)[number];

export const completedTasks = signal<Set<BeginnerTask>>(new Set());

export const allTasksCompleted = computed(() => {
  return completedTasks.get().size === BEGINNER_TASKS_COUNT;
});

export const markComplete = (taskId: BeginnerTask): void => {
  const newCompletedTasks = new Set(completedTasks.get());
  newCompletedTasks.add(taskId);
  completedTasks.set(newCompletedTasks);

  try {
    const tasksArray = Array.from(newCompletedTasks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasksArray));
  } catch (error) {
    console.warn('Failed to save completed task to local storage:', error);
  }
};

export const reset = (): void => {
  completedTasks.set(new Set());

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear completed tasks from local storage:', error);
  }
};

export const loadFromStorage = (): void => {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    if (savedTasks) {
      const tasksArray = JSON.parse(savedTasks) as BeginnerTask[];
      const validTasks = tasksArray.filter((task): task is BeginnerTask =>
        isBeginnerTask(task)
      );
      completedTasks.set(new Set(validTasks));
    }
  } catch (error) {
    console.group('Failed to load completed beginner tasks from local storage');
    console.warn(error);
    console.warn('Resetting all beginner tasks to incomplete.');
    console.groupEnd();
    reset();
  }
};
