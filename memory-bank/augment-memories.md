# Lit Component Best Practices

- Use @query decorator for element selection instead of shadowRoot.querySelector
- Use 'nothing' when removing attributes is needed, otherwise use empty template strings (html``)
- Implement functionality as a Lit controller rather than a mixin when not modifying component's API
- Use private getters that depend on signals/state properties for reactive data instead of methods
- Use @property for variables with public getters/setters rather than @state with manual requestUpdate()
- Clean up ResizeObservers in disconnectedCallback() to prevent memory leaks
- Avoid updated() lifecycle method for signal changes as it runs too frequently

# Data Fetching and State Management

- Use UrqlQueryController for data fetching in components with cache directive for successful results
- Query idea contracts directly using their ABI when appropriate instead of urql queries
- Solution data should be fetched from GraphQL using the Solution query where indexed by TheGraph
- For solution withdrawals, read tokensContributed and tokensWithdrawn directly from the Solution contract
- TheGraph's GraphQL API doesn't support direct field-to-field comparisons in where clauses; filter client-side
- Load balance information in the background with a spinner rather than showing 0 initially

# Component Design and Form Validation

- Create new components in src/features/common/components directory
- Create reusable components in src/features/common/components to replace duplicate rendering logic across multiple
  files.
- Validate forms only on user interaction or submission rather than creating additional state variables
- Use standard HTML validation attributes with Shoelace components instead of manual validation
- Allow fractional values in number inputs and avoid using the min attribute if it forces integer-only steps
- Custom input components should bubble up validity to parent forms
- Factor out repeated form data processing into reusable functions rather than duplicating code

# Token Handling and Transactions

- Implement token-input component for handling different token types with appropriate validation
- For UPD tokens, support different anti-spam fee types: 'none', 'fixed', or 'variable'
- Use 10^29 for updraft contract approvals, but exact amounts for idea and solution contracts
- Solution contract functions don't require anti-spam fees
- Use formatAmount() function instead of shortNum(formatUnits()) for formatting token amounts
- Use viem's fromHex utility for decoding hex data instead of Buffer.from methods
- When performing arithmetic operations with bigints, ensure proper bigint handling by explicitly using bigint
  operations.

# Solution Contract Functionality

- Solution contract has withdrawFunds(address to, uint256 amount) for drafters when funding goal is reached
- For withdrawals, calculate amount as tokensContributed minus tokensWithdrawn
- Solution contract's extendGoal function allows updating goal, deadline, and solution information
- Users with stakes in funded solutions can remove stakes using the removeStake function
- Solution positions differ from idea positions in withdrawal mechanics
- Display a callout for failed solution goals similar to the one used for successful goals, rather than duplicating
  withdraw functionality that already exists in the positions section.
- Place solution-related components in /features/solution/components/ directory and import them using the
  @components/solution/ alias.

# CSS and Styling

- Target elements based on DOM hierarchy rather than specific element types
- Apply 'color: var(--no-results)' styling to all 'no results' or filler text
- Set stroke='currentColor' in SVG icons to allow color control via CSS
- Use SVG files or emojis for icons instead of named icons from Shoelace
- Set cursor:pointer on all clickable elements within anchor tags for consistent cursor behavior
- Create reusable style files in src/features/common/styles directory (like dialog-styles.ts, large-card-styles.ts)
  instead of extending base components when only sharing CSS.
- Page headings should not wrap to multiple lines if font size is small enough while still staying within the 64px
  height constraint.
- Page headings should not wrap to multiple lines as the layout expects headers to be no taller than 64px.
- Add vertical spacing between buttons when they wrap to a new line.
- On mobile screens, use a thick drop shadow for the overlay sidebar menu and add smooth transitions when
  opening/closing the sidebar.
- Overlay components should only be used at the 768px or below breakpoint (mobile screens), not on wider screens.
- Make inputs and textareas responsive by allowing them to grow up to 50rem wide without causing sidebars to shrink,
  while also shrinking to fit available space without clipping.

# Data Ordering and Querying

- Order ideas and solutions by newest first (using startDate or createdDate)
- Include both items funded by a user and items created by that user in queries
- Deduplicate ideas and solutions to show each item at most once
- Only display viable positions (not withdrawn) when showing users' positions
- Make query result counts configurable with appropriate defaults

# Codebase Improvements

- Refactor similar functionality into base components, utilities, or controllers
- Implement consistent error handling with console.error logging
- Avoid using 'any' type in TypeScript
- Store API keys in separate files added to .gitignore
- Prefix client-side environment variables with VITE_ when using Vite
- For case-insensitive string comparisons, convert both strings to lowercase or uppercase