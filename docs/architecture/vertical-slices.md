# Updraft Frontend Vertical Slice (Feature) Architecture

## Overview

Our frontend is organized using **Vertical Slice Architecture**. Instead of grouping code by technical layer
(components, state, queries, styles), at the top level we group everything **by feature**. This improves cohesion,
encapsulation, and developer experience.

Each feature "slice" contains **all code related to that feature**: components, state, GraphQL queries, types, and
tests.

---

## What is a Feature?

A *feature* is grouping of related code. It could represent a structure like a page or layout section, or a concept like
an "Idea," a "Solution," or a "User."

---

## Why Vertical Slices?

- **Grouping:** All related code lives together.
- **Easier onboarding:** New developers can focus on one slice.
- **Simpler changes:** Modify a feature without hunting across folders.
- **Better encapsulation:** Features own their data, UI, and logic.
- **Scalable:** Add new features without cluttering global folders.

---

## Directory Structure

```
src/
  features/
    idea/
      components/
      queries/
      state/
      types/
      __tests__/
    solution/
      components/
      queries/
      state/
      types/
      __tests__/
    user/ {same structure as above}
    tags/ 
    search/
    layout/
    common/
      components/
      state/
      styles/
      types/
      utils/
```

- **Each feature** has its own folder with everything it needs.
- **Common** contains components, state, styles, utilities and types that don't fit the concepts of the other features.

---

## Feature Slice Contents

- **components/**: Lit components specific to the feature
- **queries/**: GraphQL documents for the feature
- **state/**: Signals, stores, and context for the feature
- **types/**: Feature-specific types, usually re-exported from `@gql` or defined locally
- **__tests__/**: Unit and integration tests for the feature

---

## Types Organization

- Each feature has a `types/index.ts` that **re-exports only its domain types**.
- Most core entities come from GraphQL codegen (`@gql`).
- Example: `features/idea/types/index.ts`:

```ts
export type { Idea, IdeaContribution } from '@gql';
```

- Shared types (e.g., `UpdraftSettings`) live in `features/common/types/`.

---

## Adding a New Feature

1. **Create a folder** under `src/features/your-feature/`.
2. Add subfolders: `components/`, `queries/`, `state/`, `types/`, `__tests__/`.
3. Define GraphQL queries in `queries/`.
4. Generate or define types in `types/`.
5. Implement signals/state in `state/`.
6. Build components in `components/`.
7. Write tests in `__tests__/`.
8. Expose public API via `index.ts` if needed.
9. Consider adding paths to `tsconfig.json` and `vite.config.js` to access your components and state via `@components`
   and `@state`.
10. Consider adding imports to `src/types/index.ts` to access your types via `@/types`

---

## Best Practices

- **Use Signals** for reactive state (`@lit-labs/signals`).
- **Use `SignalWatcher(LitElement)`** for components with signals.
- **Use `@lit-labs/signals`'s `html`** template tag.
- **Use `watch()`** directive for granular updates.
- **Use GraphQL codegen** for types.
- **Persist state** locally or via backend as needed.
- **Minimize global state.** Prefer feature-local signals.
- **Document** your feature with README or comments.

---

## Summary

Vertical slices make our codebase **modular, maintainable, and scalable**. Each feature owns its UI, data, and logic,
enabling faster development and easier onboarding.

When in doubt, **keep related code together inside the feature slice**.