# Active Context

## Current Focus

The current development focus is on implementing and optimizing the use of Lit Signals for state management throughout the application. This includes ensuring that all components follow the best practices outlined in the `docs/lit-signals-best-practices.md` document.

A new focus is the adoption of urql's subscription/query observable pattern for GraphQL data fetching, replacing the use of @lit/task for these cases. Task remains appropriate for smart contract reads and other one-off async operations.

## Recent Changes

- Added comprehensive documentation on Lit Signals best practices
- Initial project structure and configuration set up
- Core dependencies installed and configured
- Adopted urql subscription/query observable pattern for GraphQL data fetching, replacing Task for these cases

## Lit Signals Implementation

A key focus area is the proper implementation of Lit Signals for reactive state management. The documentation in `docs/lit-signals-best-practices.md` outlines:

1. Signal creation and usage patterns
2. Component integration with SignalWatcher
3. Fine-grained updates with watch()
4. Centralized state patterns
5. When to use Signals vs. Context

## Next Steps

1. **Implement Core Components**

   - Create base components following Lit Signals best practices
   - Ensure proper state management patterns

2. **Build State Management System**

   - Set up centralized state with Signals
   - Implement data fetching with Tasks

3. **Wallet Integration**

   - Implement Web3 connectivity with Wagmi
   - Set up SIWE authentication flow

4. **UI Development**
   - Develop key UI components
   - Implement responsive layouts
   - Ensure accessibility

## Active Decisions

### State Management Approach

The decision to use Lit Signals for state management is based on:

1. The need for fine-grained reactivity in the UI
2. Performance benefits of targeted updates
3. Integration with the Lit component system
4. Alignment with modern reactive programming patterns

### Component Architecture

The current approach is to:

1. Build reusable base components extending from SignalWatcher(LitElement)
2. Use centralized state patterns for shared data
3. Implement Task-based async operations for data fetching
4. Apply the appropriate signal or context pattern based on use case

### Data Fetching Approach

- Use urql subscriptions/observables for GraphQL data fetching to leverage cache and reactivity
- Use @lit/task for smart contract reads and non-urql async operations

## Current Challenges

1. **Implementing Best Practices**

   - Ensuring all developers understand and follow Lit Signals patterns
   - Avoiding common anti-patterns in signal usage

2. **Integration with Web3**

   - Connecting Lit components with wallet functionality
   - Managing state related to blockchain interactions

3. **Performance Optimization**
   - Using fine-grained updates where appropriate
   - Balancing reactivity with performance

## Testing Focus

Current testing approach:

1. Unit tests for components using Web Test Runner
2. Testing signal-based state management
3. Verifying proper reactivity in components

## Documentation Needs

The following documentation is being developed or refined:

1. Component usage guidelines
2. State management patterns
3. Development workflows
4. Testing strategies
