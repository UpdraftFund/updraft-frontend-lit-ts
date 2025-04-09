import { stub } from 'sinon';

// Create mock for the idea state context
export const ideaContext = Symbol('ideaContext');

// Create mock for the setHotIdeas function
export const setHotIdeas = stub();

// Create mock for the getIdeaState function
export const getIdeaState = () => ({
  hotIdeas: [],
});
