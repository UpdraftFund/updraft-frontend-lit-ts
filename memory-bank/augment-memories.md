# Lit Component Best Practices
- Use @query decorator for element selection instead of shadowRoot.querySelector
- Use 'nothing' when removing attributes is needed, otherwise use empty template strings (html``)
- Implement functionality as a Lit controller rather than a mixin when not modifying component's API
- Use private getters that depend on signals/state properties for reactive data instead of methods
- Use @property for variables with public getters/setters rather than @state with manual requestUpdate()
- Clean up ResizeObservers in disconnectedCallback() to prevent memory leaks
- Avoid updated() lifecycle method for signal changes as it runs too frequently

# Data Fetching and State Management

- Use UrqlQueryController for data fetching with cache directive for successful results
- Query idea contracts directly using their ABI when appropriate instead of urql queries
- Solution data should be fetched from GraphQL using the Solution query where indexed by TheGraph
- For solution withdrawals, read tokensContributed and tokensWithdrawn directly from the Solution contract
- TheGraph's GraphQL API doesn't support direct field-to-field comparisons in where clauses; filter client-side
- Load balance information in the background with a spinner rather than showing 0 initially
- In the Solution GraphQL type, the idea field is required (not optional)

# Component Design and Form Handling

- Create new components in src/features/common/components directory for reusability
- Validate forms only on user interaction or submission rather than creating additional state variables
- Use standard HTML validation attributes with Shoelace components instead of manual validation
- Allow fractional values in number inputs and avoid using the min attribute if it forces integer-only steps
- Custom input components should bubble up validity to parent forms
- Factor out repeated form data processing into reusable functions
- For formatted text, prefer using <div contenteditable> approach as suggested in UPD-170
- For rich text formatting, prefer preserving pasted formatting over creating complex rich text editors
- Text areas should use label-with-hint components, avoid placeholder text, never use scroll bars, and avoid unwanted
  vertical gaps
- For form input components, prefer using slots for label components rather than negative margins
- Prefer using slots instead of properties for content in display components, and replace wrapper elements with the
  display component itself while applying the wrapper's styles and classes to the display component.
- Prefer implementing Form-Associated Custom Elements API over hidden input fields for custom form components, as hidden
  inputs in shadow DOM are not accessible to parent forms.
- Form-Associated Custom Elements should use consistent property naming for ElementInternals (prefer 'internals' over '
  internals_'), implement proper form lifecycle callbacks with reset listeners, include validation message state
  tracking, and add lifecycle methods for form integration.

# Token Handling and Transactions
- Implement token-input component for handling different token types with appropriate validation
- For UPD tokens, support different anti-spam fee types: 'none', 'fixed', or 'variable'
- Use 10^29 for updraft contract approvals, but exact amounts for idea and solution contracts
- Solution contract functions don't require anti-spam fees
- Use formatAmount() function instead of shortNum(formatUnits()) for formatting token amounts
- Use viem's fromHex utility for decoding hex data
- Ensure proper bigint handling by explicitly using bigint operations

# Solution Contract Functionality
- Solution contract has withdrawFunds(address to, uint256 amount) for drafters when funding goal is reached
- For withdrawals, calculate amount as tokensContributed minus tokensWithdrawn
- Solution contract's extendGoal function allows updating goal, deadline, and solution information
- Users with stakes in funded solutions can remove stakes using the removeStake function
- Display a callout for failed solution goals similar to successful goals
- Place solution-related components in /features/solution/components/ directory

# CSS and Styling

- Use colors from theme.css for styling, ensuring dark mode compatibility
- Target elements based on DOM hierarchy rather than specific element types
- Apply 'color: var(--no-results)' styling to all 'no results' or filler text
- Set stroke='currentColor' in SVG icons to allow color control via CSS
- Use SVG files or emojis for icons instead of named icons from Shoelace
- Set cursor:pointer on all clickable elements within anchor tags
- Create reusable style files in src/features/common/styles directory
- Page headings should not wrap to multiple lines (64px height constraint)
- Add vertical spacing between buttons when they wrap
- Use thick drop shadow for mobile overlay sidebar menu with smooth transitions
- Make inputs and textareas responsive up to 50rem wide
- Prefer minimal CSS in display components that rely on parent styling

# Data Ordering and Development Practices
- Order ideas and solutions by newest first (using startDate or createdDate)
- Include both items funded by a user and items created by that user in queries
- Deduplicate ideas and solutions to show each item at most once
- Only display viable positions (not withdrawn) when showing users' positions
- Refactor similar functionality into base components, utilities, or controllers
- Implement consistent error handling with console.error logging
- Avoid using 'any' type in TypeScript
- Store API keys in separate files added to .gitignore
- Prefix client-side environment variables with VITE_ when using Vite
- This project uses yarn as the package manager, not npm
- This project uses `yarn tsc` for TypeScript type checking, not npx tsc.

# Testing

- This project uses @open-wc/testing framework with @web/test-runner for testing, not vitest. Tests use expect from
  @open-wc/testing and follow the pattern of importing { expect, fixture, html } from '@open-wc/testing'.

# Security

- Consider using DOMPurify for HTML sanitization instead of custom sanitizers
- DOMPurify package includes TypeScript types built-in, no need to install @types/dompurify separately.
- Social media previews should strip HTML tags from formatted text descriptions to avoid showing raw HTML in preview
  snippets.
- Social media previews should strip HTML tags without converting HTML entities to text first, as the subsequent
  escapeHtml() function will double-encode them, causing '&amp;' '&quot;' '&#039;' to appear in preview text.
- For DOMPurify HTML sanitization, consider using KEEP_CONTENT: true to preserve inner text of unsupported tags,
  refactor repeated sanitization configurations into reusable functions, and research DOMPurify's recommended default
  tag lists for rich text pasting.