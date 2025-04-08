# Tags Feature Tests

This directory contains tests for tag-related components and functionality.

## Testing Guidelines

- Use `@open-wc/testing` for assertions and testing utilities
- Tests should be named with the `.test.ts` extension
- Mock external dependencies when necessary
- Test both component functionality and rendering

## Example Test Structure

```typescript
import { expect, fixture, html } from '@open-wc/testing';
import '../tag-component.js';

describe('TagComponent', () => {
  it('renders correctly', async () => {
    const el = await fixture(html`<tag-component></tag-component>`);
    expect(el.shadowRoot).to.exist;
    // Add more assertions here
  });
  
  it('responds to property changes', async () => {
    const el = await fixture(html`<tag-component></tag-component>`);
    el.property = 'new value';
    await el.updateComplete;
    // Test the component's response to property changes
  });
});
```

For more information on testing Lit components, refer to the [Lit testing documentation](https://lit.dev/docs/tools/testing/).
