# Updraft GraphQL Schema Reference

This document provides a reference for the Updraft GraphQL schema used in frontend development. The schema defines the data entities, their relationships, and the queries available for data fetching.

## Core Entities

### User

Users represent participants in the Updraft ecosystem, including idea creators, solution drafters, and funders.

```graphql
type User {
  id: Bytes!          # Ethereum address (0x...)
  profile: Bytes      # IPFS-stored profile data (encoded as hex)
}
```

### Idea

Ideas represent proposals that can be funded and implemented as solutions.

```graphql
type Idea {
  id: Bytes!             # Unique identifier 
  creator: User!         # The user who created the idea
  startTime: BigInt!     # When the idea was created
  shares: BigInt!        # Total shares issued for the idea
  name: String           # Human-readable name
  description: String    # Detailed description
  tags: [String!]        # Associated tags for categorization and discovery
  funderReward: BigInt!  # Reward allocated to funders
}
```

### Solution

Solutions represent implementations of ideas.

```graphql
type Solution {
  id: Bytes!              # Unique identifier
  idea: Idea!             # The idea this solution implements
  drafter: User!          # The user implementing the solution
  fundingToken: Bytes!    # Token address used for funding
  startTime: BigInt!      # When the solution was created
  deadline: BigInt!       # Deadline for completion
  modifiedTime: BigInt!   # Last update timestamp
  shares: BigInt!         # Total shares issued
  tokensContributed: BigInt! # Total funding received
  fundingGoal: BigInt!    # Target funding amount
  progress: BigInt!       # Progress toward completion
  stake: BigInt!          # Staked amount by drafter
  info: Bytes!            # Additional solution information
  funderReward: BigInt!   # Reward allocated to funders
}
```

### IdeaContribution

Represents funding contributions to ideas.

```graphql
type IdeaContribution {
  id: Bytes!              # Unique identifier
  idea: Idea!             # The funded idea
  funder: User!           # User who provided funding
  positionIndex: BigInt!  # Index of contribution
  contribution: BigInt!   # Amount contributed
  createdTime: BigInt!    # When the contribution was made
}
```

### SolutionContribution

Represents funding contributions to solutions.

```graphql
type SolutionContribution {
  id: Bytes!              # Unique identifier
  solution: Solution!     # The funded solution
  funder: User!           # User who provided funding
  positionIndex: BigInt!  # Index of contribution
  contribution: BigInt!   # Amount contributed
  refunded: Boolean!      # Whether the contribution was refunded
  createdTime: BigInt!    # When the contribution was made
}
```

### TagCount

Tracking popularity and usage of tags.

```graphql
type TagCount {
  id: String!            # Tag text as ID
  count: BigInt!         # Number of ideas using this tag
}
```

## Common Query Patterns

### Fetching Hot Ideas

```graphql
query HotIdeas {
  ideas(orderBy: shares, orderDirection: desc, first: 10) {
    id
    name
    description
    tags
    shares
    creator {
      id
      profile
    }
  }
}
```

### Fetching User Profile

```graphql
query Profile($userId: ID!) {
  user(id: $userId) {
    id
    profile
  }
}
```

### Searching Ideas by Tag

```graphql
query IdeasByTag($tag: String!) {
  ideas(where: {tags_contains: [$tag]}) {
    id
    name
    description
    tags
    shares
  }
}
```

### Searching for Solutions for an Idea

```graphql
query SolutionsForIdea($ideaId: ID!) {
  solutions(where: {idea: $ideaId}) {
    id
    drafter {
      id
      profile
    }
    fundingGoal
    tokensContributed
    deadline
    progress
  }
}
```

## Best Practices for GraphQL Queries

1. **Request Only Needed Fields**: Include only fields you need to reduce response size
2. **Use Pagination**: For large result sets, use `first` and `skip` parameters
3. **Consistent Naming**: Use descriptive names for queries that match their purpose
4. **Consider Ordering**: Use `orderBy` and `orderDirection` to get most relevant results first
5. **Filter Efficiently**: Use the most specific filter conditions available
6. **Use Fragments**: For repeated field selections, use fragments

## Working with The Graph Filter System

The Graph provides a comprehensive filtering system for queries. Common patterns include:

- **Exact Match**: `where: { field: value }`
- **Contains**: `where: { tags_contains: ["value"] }`
- **Contains Case Insensitive**: `where: { name_contains_nocase: "value" }`
- **Greater/Less Than**: `where: { shares_gt: "100" }`
- **Multiple Conditions**: `where: { AND: [{condition1}, {condition2}] }`

Refer to the complete schema in `.graphclient/schema.graphql` for all available filtering options.
