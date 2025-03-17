import { createContext } from '@lit/context';
import { signal, computed } from '@lit-labs/signals';

export interface BeginnerTask {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  route: string;
}

export interface BeginnerTasksState {
  // Core data
  tasks: BeginnerTask[];
  completedTasks: Set<string>;

  // Computed values
  isAllTasksCompleted: boolean;

  // Actions
  completeTask: (taskId: string) => void;
  resetState: () => void;
}

// Internal signals
export const tasks = signal<BeginnerTask[]>([
  {
    id: 'follow-user',
    title: 'Follow Someone',
    description:
      "A great way to learn is by watching another user. You can see a user's activity on their profile page. Go to Adam's profile and follow him from there.",
    buttonText: "Adam's profile",
    route: '/profile/adam',
  },
  {
    id: 'watch-tag',
    title: 'Watch a Tag',
    description:
      'Stay up to date on the latest activity from a project, DAO, investor, builder, or topic. Search for the [updraft] tag and watch it.',
    buttonText: 'Search for [updraft]',
    route: '/discover?tab=search&search=[updraft]',
  },
  {
    id: 'connect-wallet',
    title: 'Connect a Wallet',
    description:
      'Funding happens through an Ethereum wallet. Choose a wallet provider, install it, then click "Connect Wallet"',
    buttonText: 'Connect Wallet',
    route: '',
  },
  {
    id: 'get-upd',
    title: 'Get UPD🪁',
    description:
      "You need the right balance of ETH, UPD, and other tokens to use Updraft. You'll need at least 5 UPD to complete the other tasks. Swap some ETH for UPD.",
    buttonText: 'Swap for UPD',
    route: '/swap',
  },
  {
    id: 'fund-idea',
    title: 'Fund an Idea',
    description:
      'You can earn UPD by funding a popular idea. Look for the 💰 symbol to see the reward you can earn from future funders. Find an Idea and fund it with UPD.',
    buttonText: 'Go to "Example" Idea',
    route: '/idea/example',
  },
  {
    id: 'fund-solution',
    title: 'Fund a Solution',
    description:
      'Every Idea needs a Solution. A great team and execution can change the world. Fund a Solution you love and earn a reward 💰 if others feel the same way.',
    buttonText: 'Go to "Example" Solution',
    route: '/solution/example',
  },
  {
    id: 'create-profile',
    title: 'Create a Profile',
    description:
      "You're nearing the end of your beginner's journey. Soon others will follow and learn from you. Create a profile so they can see what you're up to and follow your lead.",
    buttonText: 'Go to Your Profile',
    route: '/profile',
  },
]);

export const completedTasks = signal<Set<string>>(new Set());

// Computed values
export const isAllTasksCompleted = computed(() => {
  return completedTasks.get().size === tasks.get().length;
});

// Actions
export const completeTask = (taskId: string): void => {
  const newCompletedTasks = new Set(completedTasks.get());
  newCompletedTasks.add(taskId);
  completedTasks.set(newCompletedTasks);
};

export const resetState = (): void => {
  completedTasks.set(new Set());
};

// Context
export const beginnerTasksContext = createContext<BeginnerTasksState>(
  'beginner-tasks-state'
);
