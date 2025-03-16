import { signal, computed } from '@lit-labs/signals';
import { createContext } from '@lit/context';

// Define the interface for the Idea State
export interface IdeaState {
  ideaId: string | null;
  tags: string[];
  hasTags: boolean;
  isLoading: boolean;
  setIdeaId: (id: string | null) => void;
  setTags: (tags: string[]) => void;
  resetState: () => void;
}

// Create signals for the state
export const ideaId = signal<string | null>(null);
export const tags = signal<string[]>([]);
export const isLoading = signal<boolean>(false);

// Create computed values
export const hasTags = computed(() => tags.get().length > 0);

// Create actions
export const setIdeaId = (id: string | null) => {
  ideaId.set(id);
};

export const setTags = (newTags: string[]) => {
  tags.set(newTags);
};

export const resetState = () => {
  ideaId.set(null);
  tags.set([]);
  isLoading.set(false);
};

// Create the context
export const ideaContext = createContext<IdeaState>('idea-state');

// Create a getter for the state
export const getIdeaState = (): IdeaState => {
  return {
    ideaId: ideaId.get(),
    tags: tags.get(),
    hasTags: hasTags.get(),
    isLoading: isLoading.get(),
    setIdeaId,
    setTags,
    resetState
  };
};
