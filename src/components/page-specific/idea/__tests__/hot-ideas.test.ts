import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import { createContext } from '@lit/context';

import '../hot-ideas';
import { HotIdeas } from '../hot-ideas';
import { setHotIdeas } from '@/state/idea-state';
import urqlClient from '@/urql-client';

// Mock the urql client
vi.mock('@/urql-client', () => ({
  default: {
    query: vi.fn().mockReturnValue({
      subscribe: vi.fn().mockReturnValue({
        unsubscribe: vi.fn(),
      }),
    }),
  },
}));

// Mock the Task module
vi.mock('@lit/task', () => ({
  Task: class MockTask {
    constructor(host, callback) {
      this.host = host;
      this.callback = callback;
      this.renderCallback = null;
    }
    render(renderCallback) {
      this.renderCallback = renderCallback;
      return this.renderCallback.complete([]);
    }
    run() {
      return this.callback();
    }
  },
}));

// Mock the setHotIdeas function
vi.mock('@/state/idea-state', () => ({
  ideaContext: createContext('idea-context'),
  setHotIdeas: vi.fn(),
  getIdeaState: vi.fn().mockReturnValue({
    hotIdeas: [],
  }),
}));

describe('HotIdeas', () => {
  let element;
  
  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create a mock for the query result
    const mockQueryResult = {
      data: {
        ideas: [
          { id: '1', title: 'Test Idea 1', shares: 10 },
          { id: '2', title: 'Test Idea 2', shares: 5 },
        ],
      },
    };
    
    // Setup the mock implementation
    urqlClient.query.mockReturnValue({
      subscribe: vi.fn().mockImplementation((callback) => {
        callback(mockQueryResult);
        return { unsubscribe: vi.fn() };
      }),
    });
    
    // Create the element
    element = await fixture(html`<hot-ideas></hot-ideas>`);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should be defined', () => {
    expect(element).to.be.instanceOf(HotIdeas);
  });
  
  it('should call the query on connectedCallback', () => {
    expect(urqlClient.query).toHaveBeenCalled();
  });
  
  it('should call setHotIdeas with the query result', async () => {
    expect(setHotIdeas).toHaveBeenCalledWith([
      { id: '1', title: 'Test Idea 1', shares: 10 },
      { id: '2', title: 'Test Idea 2', shares: 5 },
    ]);
  });
  
  it('should render hot ideas from the state', async () => {
    // Update the mock state
    element.ideaState = {
      hotIdeas: [
        { id: '1', title: 'Test Idea 1', shares: 10 },
        { id: '2', title: 'Test Idea 2', shares: 5 },
      ],
    };
    
    // Force a re-render
    element.requestUpdate();
    await element.updateComplete;
    
    // Check that the ideas are rendered
    const ideaCards = element.shadowRoot.querySelectorAll('idea-card-small');
    expect(ideaCards.length).to.equal(2);
  });
});
