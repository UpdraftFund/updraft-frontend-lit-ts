# Phase 1: State Management Implementation Plan

## Overview

This document outlines a detailed plan for implementing Phase 1 of the Updraft Frontend Architecture Improvement Plan, which focuses on enhancing state management. Based on our experiences with the related-ideas component, we've identified key patterns, challenges, and solutions for effective state management in our Lit-based application.

## Lessons Learned

Our recent work with the related-ideas component revealed several important insights:

1. **Context Provider Challenges**: While `@lit/context` provides a powerful mechanism for state sharing, we encountered challenges with component reactivity when consuming context values. Components didn't consistently re-render when context values changed.

2. **Signal-Based Reactivity**: The `lit-labs/signals` library offers excellent reactivity, but needs careful integration with the component lifecycle and proper dependency tracking.

3. **Navigation State Reset**: State needs to be properly reset during navigation to prevent stale data. This is especially important for route-specific data like idea tags.

4. **Task Dependencies**: When using `lit-labs/task`, all reactive dependencies must be included in the dependency array to ensure tasks re-run when relevant state changes.

5. **GraphQL Query Patterns**: The way we structure GraphQL queries affects how efficiently we can fetch and update data. Tags formatting in particular requires careful handling.

6. **Development Patterns**: Direct DOM updates (like `this.renderRoot.innerHTML = ...`) should be avoided in favor of Lit's declarative rendering pattern.

7. **Hybrid Approaches**: In some cases, a hybrid approach combining state context with direct event communication provides the most reliable solution, especially for timing-sensitive interactions.

8. **Local State Backup**: Components that consume state from context can benefit from maintaining local state as a backup, particularly when dealing with asynchronous updates.

## Implementation Approach

### 1. State Management Architecture

We will implement a domain-based state management approach using `lit-labs/signals` and `@lit/context`:

#### A. Core Architecture Components:

1. **State Slices**: Individual domain-specific state modules (e.g., `idea-state.ts`, `user-state.ts`)
   - Each module will export:
     - Signal instances for state values
     - Functions to update state
     - Context providers for consumption

2. **Context Providers**: Centralized in `my-app.ts` using the `@provide` decorator
   - Use getter methods to ensure latest values are provided

3. **Context Consumers**: Components use the `@consume` decorator with `subscribe: true` option

4. **Event-Based Communication**: For timing-critical updates, custom events complement the context system
   - Events should be properly documented and follow a consistent naming pattern
   - Components should clean up event listeners in disconnectedCallback

#### B. State Organization Pattern:

```typescript
// State Example: idea-state.ts
import { signal, computed } from '@lit-labs/signals';
import { createContext } from '@lit/context';

// Create state signals
export const ideaTags = signal<string[]>([]);
export const activeIdeaId = signal<string | null>(null);

// Computed values
export const hasIdeaTags = computed(() => ideaTags.get().length > 0);

// State operations
export const setIdeaTags = (tags: string[]): void => {
  ideaTags.set([...tags]);
};

export const resetIdeaTags = (): void => {
  ideaTags.set([]);
};

// Define interface for the context
export interface IdeaState {
  tags: string[];
  ideaId: string | null;
  hasTags: boolean;
  setTags: (tags: string[]) => void;
  resetTags: () => void;
}

// Create the context
export const ideaContext = createContext<IdeaState>('idea-state');
```

## Revised Implementation Steps

### Phase 1.1: Documentation and Testing Framework 

**Timeframe**: 1-2 weeks

**Tasks**:

1. **State Management Documentation** 
   - Create state module interface specifications
   - Document patterns for state consumption
   - Define guidelines for when to use state vs. props
   - Establish conventions for state updates and reactivity

2. **Test Specifications** 
   - Create test cases for state modules
   - Define integration tests for component interactions
   - Establish patterns for testing reactivity and state changes
   - Document test utilities and helpers

3. **Implementation Templates** 
   - Create sample implementations of state modules
   - Develop reference implementations for consuming components
   - Document implementation patterns with examples

### Phase 1.2: Core State Implementation 

**Timeframe**: 1 week

**Tasks**:
1. Set up state directory and module structure 
2. Implement idea state module following the documented patterns 
3. Update `my-app.ts` to provide idea state 
4. Create necessary types and interfaces 
5. Implement tests for the idea state module 

### Phase 1.3: Idea Page Migration 

**Timeframe**: 1 week

**Tasks**:
1. Update `idea-page.ts` to use idea state 
2. Migrate `related-ideas.ts` to consume from context 
3. Update `right-side-bar.ts` to properly display idea information 
4. Test and verify navigation between ideas 
5. Implement integration tests for idea-related components 

### Phase 1.4: User State Implementation 

**Timeframe**: 1 week

**Tasks**:
1. Implement user state module
2. Update profile components
3. Migrate wallet connection flow
4. Test user-related functionality
5. Implement tests for user state module

### Phase 1.5: App-wide State 

**Timeframe**: 1 week

**Tasks**:
1. Implement app state module
2. Update layout components
3. Centralize theme management
4. Test across different devices and layouts
5. Implement tests for app state module

## Best Practices

1. **Task Dependencies**:
   ```typescript
   private _myTask = new Task(
     this,
     async () => { /* task logic */ },
     () => [this.propA, this.contextValue.someProperty] // Include all reactive dependencies
   );
   ```

2. **Context Consumption**:
   ```typescript
   @consume({ context: ideaContext, subscribe: true })
   ideaState!: IdeaState;
   ```

3. **Rendering Based on State**:
   ```typescript
   render() {
     return html`
       ${this.ideaState.hasTags
         ? html`<div>Tags: ${this.ideaState.tags.join(', ')}</div>`
         : html`<div>No tags available</div>`
       }
     `;
   }
   ```

4. **State Updates**:
   ```typescript
   handleTagsLoaded(tags: string[]) {
     this.ideaState.setTags(tags);
   }
   ```

5. **Hybrid State Management**:
   ```typescript
   // In component that generates data
   updateTags(tags: string[]) {
     // Update central state
     setTags(tags);
     
     // Also dispatch event for immediate notification
     this.dispatchEvent(new CustomEvent('tags-updated', {
       detail: { tags },
       bubbles: true,
       composed: true
     }));
   }
   
   // In consuming component
   connectedCallback() {
     super.connectedCallback();
     this._tagsHandler = (e) => {
       this._localTags = e.detail.tags;
       this._runTask();
     };
     window.addEventListener('tags-updated', this._tagsHandler);
   }
   
   disconnectedCallback() {
     super.disconnectedCallback();
     window.removeEventListener('tags-updated', this._tagsHandler);
   }
   ```

6. **Local State Backup**:
   ```typescript
   // Maintain local state as backup
   @state()
   private _localTags: string[] = [];
   
   // Use the most reliable source
   get effectiveTags() {
     const contextTags = this.ideaState?.tags || [];
     return contextTags.length > 0 ? contextTags : this._localTags;
   }
   ```

## Conclusion

This Phase 1 implementation plan provides a structured approach to enhancing state management in the Updraft frontend. By starting with documentation and testing, we ensure a clear understanding of requirements and expectations before implementation begins. This approach will lead to more consistent, maintainable, and reliable state management throughout the application.

Successful implementation will set the foundation for Phase 2 (Data Fetching Layer) and Phase 3 (Component Communication Refinement) of our architecture improvement plan.

## Progress Update (March 16, 2025)

We have successfully completed Phases 1.1, 1.2, and 1.3 of our implementation plan. The idea state module is fully implemented and integrated with the idea page and related components. We've addressed several challenges with state management, particularly around the related-ideas component, by implementing a hybrid approach that combines context-based state with event-based communication.

Key accomplishments:
- Implemented idea state module with proper context providers
- Updated idea-page to use and update the state
- Fixed related-ideas component to reliably consume tags from both state and events
- Added proper lifecycle management for event listeners
- Implemented local state backup mechanisms for reliability

Next steps:
- Begin implementation of user state module (Phase 1.4)
- Plan for app-wide state management (Phase 1.5)
- Document lessons learned from the idea state implementation for future reference
