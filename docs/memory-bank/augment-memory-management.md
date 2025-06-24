# Augment Agent Memory Management

This document outlines the procedures for managing and sharing Augment Agent's accumulated memories across the
development team.

## Overview

Augment Agent learns and accumulates best practices, patterns, and project-specific knowledge during development work.
These "memories" help maintain consistency and avoid repeating past mistakes. To ensure all team members benefit from
this accumulated knowledge, we maintain a shared memory bank in the git repository.

## Memory Storage Location

**Primary File**: `docs/memory-bank/augment-memories.md`

This file contains all accumulated memories organized by category (Lit Components, Data Fetching, CSS, etc.).

## Procedure for Updating Memories

### When Augment Agent Updates Memories

1. **Automatic Update**: When Augment Agent learns something new during development, it automatically updates its
   internal memories
2. **Manual Sync**: The agent should also update the shared memory file in the repository
3. **Git Commit**: The updated memory file should be committed to the repository with a descriptive commit message

### For Human Developers

When you notice Augment Agent has learned something valuable that should be preserved:

1. **Ask the agent to update memories**: Simply say "Please update your memories with [specific knowledge]"
2. **Request memory sync**: Ask "Please update the augment-memories.md file with your latest memories"
3. **Review and commit**: Review the changes and commit them to the repository

## Memory Categories

The memories are organized into the following categories:

- **Lit Component Best Practices**: Component architecture, decorators, lifecycle methods
- **Data Fetching and State Management**: GraphQL, signals, state handling
- **Component Design and Form Handling**: Reusable components, form validation
- **Text Formatting and Content Display**: Markdown processing, content rendering
- **Token Handling and Transactions**: Blockchain interactions, token operations
- **CSS and Styling**: Theme usage, styling patterns
- **Security and HTML Handling**: Sanitization, security practices
- **Development and Testing**: Build tools, testing patterns, workflow

## Best Practices for Memory Management

### For Augment Agent

1. **Be Specific**: Memories should be specific and actionable, not vague generalizations
2. **Include Context**: Provide enough context to understand when and why a practice applies
3. **Update Regularly**: Sync memories to the shared file whenever significant learning occurs
4. **Categorize Properly**: Place memories in the appropriate category for easy discovery

### For Human Developers

1. **Review Regularly**: Periodically review the memory file to stay updated on best practices
2. **Provide Feedback**: If you notice outdated or incorrect memories, update them
3. **Share Knowledge**: When you discover new patterns or practices, ask Augment Agent to memorize them
4. **Keep It Current**: Remove or update memories that are no longer relevant

## Importing/Exporting Memories

### For New Augment Agent Sessions

When starting a new session with Augment Agent:

1. **Reference the Memory File**: The agent should automatically have access to the shared memories through the
   repository
2. **Manual Import** (if needed): Copy relevant sections from `augment-memories.md` and ask the agent to "remember these
   practices"

### For Sharing with Other AI Assistants

The memory file can be shared with other AI coding assistants by:

1. **Copy and Paste**: Copy relevant sections and provide them as context
2. **File Reference**: Point other assistants to the `augment-memories.md` file
3. **Selective Sharing**: Share only relevant categories based on the task at hand

## Memory Quality Guidelines

### Good Memory Examples

✅ **Specific and Actionable**

```
- Use @query decorator for element selection with cache:true for better performance instead of shadowRoot.querySelector
```

✅ **Includes Context**

```
- Tests should be placed in `__tests__` directories within each feature/module directory, not alongside the source files
```

### Poor Memory Examples

❌ **Too Vague**

```
- Write good code
```

❌ **Missing Context**

```
- Use signals
```

## Maintenance Schedule

- **Weekly**: Review memories for accuracy and relevance
- **Monthly**: Reorganize and consolidate similar memories
- **Quarterly**: Archive outdated memories and update categories as needed

## Troubleshooting

### Common Issues

1. **Memory Conflicts**: If memories contradict each other, prioritize the most recent and specific one
2. **Outdated Practices**: Remove memories that reference deprecated libraries or patterns
3. **Category Confusion**: If unsure where a memory belongs, place it in the most specific applicable category

### Getting Help

If you need help with memory management:

1. Ask Augment Agent to explain or clarify a specific memory
2. Request reorganization of memory categories
3. Ask for help identifying outdated or conflicting memories

## Version Control

- All memory updates should be committed to git with descriptive messages
- Use conventional commit format: `docs: update augment memories with [specific change]`
- Tag major memory reorganizations for easy reference

## Future Improvements

Potential enhancements to consider:

- **Automated Sync**: Script to automatically sync agent memories to the file
- **Memory Validation**: Tools to check for conflicts or outdated practices
- **Usage Analytics**: Track which memories are most frequently referenced
- **Integration**: Direct integration with Linear tickets or other project management tools
