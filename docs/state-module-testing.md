# State Module Testing Specification

## Overview

This document outlines the testing strategy for state modules in the Updraft frontend application. It provides patterns and examples for testing state modules, ensuring they behave correctly in isolation and when integrated with components.

## Testing Framework

We will use the following tools for testing:

- **Web Test Runner**: For running tests in a real browser environment
- **@open-wc/testing**: For testing Lit components
- **@lit-labs/testing**: For testing signals and tasks
- **Chai**: For assertions

## Test Structure

Each state module should have the following test files:

1. **Unit Tests**: Test individual signals, computed values, and actions
2. **Integration Tests**: Test how components interact with state

## Idea State Module Test Specification

### Unit Tests

```typescript
// src/state/__tests__/idea-state.test.ts
import { expect } from '@open-wc/testing';
import { 
  ideaId, 
  tags, 
  hasTags, 
  isLoading, 
  setIdeaId, 
  setTags, 
  resetState 
} from '../idea-state';

describe('Idea State Module', () => {
  beforeEach(() => {
    // Reset state before each test
    resetState();
  });

  describe('Signals', () => {
    it('should initialize with default values', () => {
      expect(ideaId.get()).to.be.null;
      expect(tags.get()).to.deep.equal([]);
      expect(isLoading.get()).to.be.false;
    });
  });

  describe('Computed Values', () => {
    it('hasTags should be false when tags is empty', () => {
      expect(hasTags.get()).to.be.false;
    });

    it('hasTags should be true when tags has items', () => {
      setTags(['tag1', 'tag2']);
      expect(hasTags.get()).to.be.true;
    });
  });

  describe('Actions', () => {
    it('setIdeaId should update ideaId signal', () => {
      setIdeaId('123');
      expect(ideaId.get()).to.equal('123');
    });

    it('setTags should update tags signal', () => {
      setTags(['tag1', 'tag2']);
      expect(tags.get()).to.deep.equal(['tag1', 'tag2']);
    });

    it('resetState should reset all signals to default values', () => {
      setIdeaId('123');
      setTags(['tag1', 'tag2']);
      isLoading.set(true);
      
      resetState();
      
      expect(ideaId.get()).to.be.null;
      expect(tags.get()).to.deep.equal([]);
      expect(isLoading.get()).to.be.false;
    });
  });
});
```

### Integration Tests

```typescript
// src/components/page-specific/idea/__tests__/related-ideas.test.ts
import { fixture, html, expect, waitUntil } from '@open-wc/testing';
import '../related-ideas';
import { RelatedIdeas } from '../related-ideas';
import { ideaContext, IdeaState, setTags } from '@/state/idea-state';
import { createContext, ContextProvider } from '@lit/context';

describe('RelatedIdeas Component with State', () => {
  let element: RelatedIdeas;
  let provider: ContextProvider<typeof ideaContext, IdeaState>;

  beforeEach(async () => {
    // Create a wrapper with context provider
    const wrapper = await fixture(html`
      <div>
        <related-ideas></related-ideas>
      </div>
    `);
    
    // Get the component
    element = wrapper.querySelector('related-ideas') as RelatedIdeas;
    
    // Reset state
    setTags([]);
  });

  it('should display no ideas message when no tags are available', async () => {
    await element.updateComplete;
    const noIdeasElement = element.renderRoot.querySelector('.no-ideas');
    expect(noIdeasElement).to.not.be.null;
  });

  it('should update when tags change in state', async () => {
    // Update tags in state
    setTags(['blockchain', 'defi']);
    
    // Wait for update
    await element.updateComplete;
    
    // Check if task is running (should show loading state)
    const spinner = element.renderRoot.querySelector('sl-spinner');
    expect(spinner).to.not.be.null;
    
    // Wait for task to complete (mock would be better in real tests)
    // This is simplified for the example
    await waitUntil(() => !element.renderRoot.querySelector('sl-spinner'));
    
    // Now should show related ideas or no ideas found
    const noIdeasElement = element.renderRoot.querySelector('.no-ideas');
    const relatedIdeasList = element.renderRoot.querySelector('.related-ideas-list');
    
    // Either no ideas found or related ideas list should be present
    expect(noIdeasElement !== null || relatedIdeasList !== null).to.be.true;
  });
});
```

## Testing Context Providers and Consumers

### Testing Context Provider

```typescript
// src/components/__tests__/my-app.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import '../my-app';
import { MyApp } from '../my-app';
import { ideaContext, resetState } from '@/state/idea-state';

describe('MyApp Component as Context Provider', () => {
  let element: MyApp;

  beforeEach(async () => {
    resetState();
    element = await fixture(html`<my-app></my-app>`) as MyApp;
  });

  it('should provide idea state context', () => {
    // Access the getter to verify it returns expected structure
    const ideaState = element.ideaState;
    
    expect(ideaState).to.have.property('ideaId');
    expect(ideaState).to.have.property('tags');
    expect(ideaState).to.have.property('hasTags');
    expect(ideaState).to.have.property('isLoading');
    expect(ideaState).to.have.property('setIdeaId');
    expect(ideaState).to.have.property('setTags');
    expect(ideaState).to.have.property('resetState');
  });

  it('should update provided context when state changes', async () => {
    // Initial state
    expect(element.ideaState.tags).to.deep.equal([]);
    
    // Update state
    element.ideaState.setTags(['tag1', 'tag2']);
    
    // Check updated state
    expect(element.ideaState.tags).to.deep.equal(['tag1', 'tag2']);
    expect(element.ideaState.hasTags).to.be.true;
  });
});
```

### Testing Context Consumer

```typescript
// src/components/page-specific/idea/__tests__/idea-page.test.ts
import { fixture, html, expect } from '@open-wc/testing';
import { createContext, ContextProvider, provide } from '@lit/context';
import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../idea-page';
import { IdeaPage } from '../idea-page';
import { ideaContext, IdeaState, resetState } from '@/state/idea-state';

// Create a test provider component
@customElement('test-provider')
class TestProvider extends LitElement {
  @provide({ context: ideaContext })
  ideaState: IdeaState = {
    ideaId: null,
    tags: [],
    hasTags: false,
    isLoading: false,
    setIdeaId: (id) => {
      this.ideaState = { ...this.ideaState, ideaId: id };
      this.requestUpdate();
    },
    setTags: (tags) => {
      this.ideaState = { ...this.ideaState, tags, hasTags: tags.length > 0 };
      this.requestUpdate();
    },
    resetState: () => {
      this.ideaState = {
        ...this.ideaState,
        ideaId: null,
        tags: [],
        hasTags: false,
        isLoading: false
      };
      this.requestUpdate();
    }
  };

  render() {
    return html`<slot></slot>`;
  }
}

describe('IdeaPage Component as Context Consumer', () => {
  let provider: TestProvider;
  let element: IdeaPage;

  beforeEach(async () => {
    // Create a wrapper with context provider
    const wrapper = await fixture(html`
      <test-provider>
        <idea-page></idea-page>
      </test-provider>
    `);
    
    provider = wrapper as TestProvider;
    element = wrapper.querySelector('idea-page') as IdeaPage;
  });

  it('should consume idea state context', async () => {
    // Wait for element to be fully initialized
    await element.updateComplete;
    
    // Update state in provider
    provider.ideaState.setTags(['blockchain', 'defi']);
    
    // Wait for update to propagate
    await element.updateComplete;
    
    // Verify component has updated based on context
    // This would depend on how the component uses the context
    // For example, if it displays tags:
    const tagsElement = element.renderRoot.querySelector('.tags');
    if (tagsElement) {
      expect(tagsElement.textContent).to.contain('blockchain');
      expect(tagsElement.textContent).to.contain('defi');
    }
  });
});
```

## Testing Setup

### Web Test Runner Configuration

Create a `web-test-runner.config.js` file in the project root:

```javascript
import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';

export default {
  files: 'src/**/*.test.ts',
  nodeResolve: true,
  browsers: [
    playwrightLauncher({ product: 'chromium' }),
  ],
  plugins: [
    esbuildPlugin({ ts: true }),
  ],
  testFramework: {
    config: {
      ui: 'bdd',
      timeout: '2000'
    }
  }
};
```

### Package.json Scripts

Add the following scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "web-test-runner",
    "test:watch": "web-test-runner --watch"
  }
}
```

## Testing Best Practices

1. **Isolation**: Test state modules in isolation first, then test integration with components

2. **Reset State**: Always reset state before each test to ensure a clean starting point

3. **Async Testing**: Use `await element.updateComplete` to ensure components have finished updating

4. **Mock External Dependencies**: Use mocks for GraphQL clients, fetch requests, etc.

5. **Test Edge Cases**: Test empty states, error states, and boundary conditions

6. **Test Reactivity**: Verify that components update correctly when state changes

7. **Test Navigation**: Verify that state is properly reset during navigation

## Test Implementation Plan

1. **Setup Testing Infrastructure**:
   - Install @web/test-runner and related packages
   - Configure web-test-runner.config.js
   - Create test helpers for common patterns

2. **Create Unit Tests**:
   - Test each state module in isolation
   - Verify signals, computed values, and actions

3. **Create Integration Tests**:
   - Test components with state
   - Verify reactivity and updates

4. **Create Navigation Tests**:
   - Test state reset during navigation
   - Verify proper state initialization

## Conclusion

By following this testing specification, we can ensure that our state management implementation is robust, reliable, and maintainable. Tests will help catch regressions early and provide documentation for how state modules should behave.
