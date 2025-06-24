# Lit Component Best Practices
- Use @query decorator for element selection with cache:true for better performance instead of shadowRoot.querySelector
- Use 'nothing' when removing attributes, empty template strings (html``) otherwise
- Implement functionality as a Lit controller rather than a mixin when not modifying component's API
- Use private getters that depend on signals/state properties for reactive data instead of methods
- Use @property for variables with public getters/setters rather than @state with manual requestUpdate()
- Clean up ResizeObservers in disconnectedCallback() to prevent memory leaks
- Avoid updated() lifecycle method for signal changes as it runs too frequently
- Avoid inline styles - use Lit's css template literal for styling instead

# Data Fetching and State Management
- Use UrqlQueryController for data fetching with cache directive for successful results
- Query idea/solution contracts directly using their ABI when appropriate instead of urql queries
- Solution data should be fetched from GraphQL using the Solution query where indexed by TheGraph
- TheGraph's GraphQL API doesn't support direct field-to-field comparisons in where clauses; filter client-side
- Load balance information in the background with a spinner rather than showing 0 initially

# Component Design and Form Handling
- Create new components in src/features/common/components directory for reusability
- Validate forms only on user interaction or submission rather than creating additional state variables
- Use standard HTML validation attributes with Shoelace components instead of manual validation
- Allow fractional values in number inputs and avoid using the min attribute if it forces integer-only steps
- Prefer implementing Form-Associated Custom Elements API over hidden input fields for custom form components
- Use import aliases where possible (e.g., '@components/common/transaction-watcher')
- Use sl-button components for refresh and copy buttons, utilizing the 'prefix' slot for icons
- Setting window.location.href should only be used as a last resort - prefer using href attribute for navigation

# Text Formatting and Content Display

- Implement content display with three categories: single-line non-formatted, multi-line non-formatted, and multi-line
  formatted
- Use turndown library to unmangle HTML from contenteditable divs, not to convert regular HTML tags to markdown
- Always pass strings through marked markdown processor without checking for markdown syntax first
- Use full GitHub Flavored Markdown (GFM) support in turndown configuration
- For GitHub Flavored Markdown support in formattedText(), consider allowing 'input' tag with 'type', 'checked', and '
  disabled' attributes for task list checkboxes, but ensure inputs are always disabled for security.
- Consider alternative libraries for HTML-to-markdown conversion instead of custom string replacement solutions
- Turndown service strips spaces from HTML content during conversion, particularly affecting list indentation - need to
  preserve spaces for proper markdown list nesting.
- TurndownService prototype methods can be overridden to customize behavior like preventing whitespace stripping during
  HTML-to-markdown conversion.
- The turndown service is successfully converting HTML back to clean markdown but all line breaks are being lost in the
  process.
- For HTML-to-Markdown conversion, look for characters that Marked interprets as indentation but Turndown won't
  collapse, and target any leading spaces for indentation preservation, not just list items.

# Token Handling and Transactions
- Implement token-input component for handling different token types with appropriate validation
- For UPD tokens, support different anti-spam fee types: 'none', 'fixed', or 'variable'
- Use 10^29 for updraft contract approvals, but exact amounts for idea and solution contracts
- Solution contract functions don't require anti-spam fees
- Use formatAmount() function instead of shortNum(formatUnits()) for formatting token amounts

# Solution Contract Functionality
- Solution contract has withdrawFunds(address to, uint256 amount) for drafters when funding goal is reached
- For withdrawals, calculate amount as tokensContributed minus tokensWithdrawn
- Solution contract's extendGoal function allows updating goal, deadline, and solution information
- Users with stakes in funded solutions can remove stakes using the removeStake function

# CSS and Styling
- Use colors from theme.css for styling, ensuring dark mode compatibility
- Apply 'color: var(--no-results)' styling to all 'no results' or filler text
- Set stroke='currentColor' in SVG icons to allow color control via CSS
- Use SVG files or emojis for icons instead of named icons from Shoelace
- Set cursor:pointer on all clickable elements within anchor tags

# Security and HTML Handling
- Use dompurify for frontend HTML sanitization and isomorphic-dompurify for server-side/Vercel functions
- For DOMPurify, use KEEP_CONTENT: true to preserve inner text of unsupported tags
- DOMPurify with KEEP_CONTENT: true decodes HTML entities when stripping tags
- Social media previews should strip HTML tags without converting HTML entities to text first

# Development and Testing

- Project uses yarn as package manager, yarn tsc for TypeScript type checking, yarn lint && yarn tsc for checks
- Testing uses @open-wc/testing framework with @web/test-runner
- Tests should be placed in `__tests__` directories within each feature/module directory, not alongside the source files
- Network configuration is environment-dependent: dev/preview uses Arbitrum Sepolia, production uses Arbitrum One
- Vercel serverless functions require import assertion type 'json' when importing JSON files
- API functions should use environment-specific subgraph URLs and support multiple network sources
- Test markdown processing by putting markdown in contentEditable divs, reading it back out, and running through
  formattedText function to verify correct output.
- Prefer headless tests over demo pages for testing functionality
- When completing a Linear ticket, mark it as "code-review" state so a human can review the work
- When updating memories, copy them to augment-memories.md file in the git repo so other developers can access and use
  the accumulated knowledge.