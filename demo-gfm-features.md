# GitHub Flavored Markdown Features Demo

This document demonstrates the new GFM features supported by the `formattedText()` function.

## Task Lists ✅

- [x] Add support for task list checkboxes
- [x] Add support for tables
- [x] Add support for strikethrough text
- [ ] Test in production
- [ ] Update documentation
    - [x] Write tests
    - [ ] Add examples

## Tables 📊

| Feature       | Status        | Security Level               |
|---------------|---------------|------------------------------|
| Task Lists    | ✅ Implemented | Safe (disabled checkboxes)   |
| Tables        | ✅ Implemented | Safe (no style attributes)   |
| Strikethrough | ✅ Implemented | Safe                         |
| Code Blocks   | ✅ Enhanced    | Safe (class attributes only) |

## Strikethrough Text

You can use ~~strikethrough~~ text to show ~~old information~~ corrections.

## Code Blocks with Syntax Highlighting

```javascript
// JavaScript example
function processMarkdown(content) {
  const html = marked(content);
  return formattedText(html);
}
```

```python
# Python example
def process_markdown(content):
    html = marked(content)
    return formatted_text(html)
```

## Security Features

The sanitizer now supports these **safe** attributes:

- `type`, `checked`, `disabled` for checkboxes
- `colspan`, `rowspan`, `scope` for tables
- `class`, `id` for styling and accessibility
- `href` for links (with URI validation)

❌ **Blocked attributes** (for security):

- `onclick` and other event handlers
- `style` attributes (prevents CSS injection)
- `src` attributes (except on allowed elements)

## Nested Lists with Tasks

1. Main project tasks
    - [x] Set up development environment
    - [x] Implement core features
        - [x] Task list support
        - [x] Table support
        - [ ] Advanced formatting
    - [ ] Testing phase
        - [x] Unit tests
        - [ ] Integration tests
2. Documentation
    - [x] API documentation
    - [ ] User guide
