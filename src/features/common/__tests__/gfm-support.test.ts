import { expect } from '@open-wc/testing';
import { render } from 'lit';
import { marked } from 'marked';
import DOMPurify, { Config } from 'dompurify';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { DirectiveResult } from 'lit/directive.js';

// Copy the updated configuration to avoid import issues
const RICH_TEXT_SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'a',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'blockquote',
    'pre',
    'code',
    // GitHub Flavored Markdown support
    'del', // Strikethrough (~~text~~)
    'input', // Task list checkboxes
    'table', // Tables
    'thead', // Table header group
    'tbody', // Table body group
    'tr', // Table rows
    'th', // Table header cells
    'td', // Table data cells
  ],
  ALLOWED_ATTR: [
    'href',
    // Task list checkbox attributes
    'type', // For input type="checkbox"
    'checked', // For checked checkboxes
    'disabled', // Task list checkboxes are disabled by default
    // Table attributes for accessibility and styling
    'scope', // For th elements (row/col/rowgroup/colgroup)
    'colspan', // For spanning multiple columns
    'rowspan', // For spanning multiple rows
    // General attributes that are safe and useful
    'class', // For CSS styling (marked.js adds language-* classes to code blocks)
    'id', // For anchoring and accessibility
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true, // Preserve text content when removing disallowed tags
};

function formatText(htmlContent: string): DirectiveResult {
  const sanitized = DOMPurify.sanitize(htmlContent, RICH_TEXT_SANITIZE_CONFIG);
  return unsafeHTML(sanitized);
}

describe('GitHub Flavored Markdown Support', () => {
  beforeEach(() => {
    marked.setOptions({
      gfm: true,
      breaks: true,
    });
  });

  it('should support task lists with checkboxes', () => {
    const markdown = `- [x] completed task
- [ ] incomplete task
  - [x] nested completed
  - [ ] nested incomplete`;

    const html = marked(markdown) as string;
    const result = formatText(html);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    expect(container.innerHTML).to.include('<input checked="" disabled="" type="checkbox">');
    expect(container.innerHTML).to.include('<input disabled="" type="checkbox">');
    expect(container.innerHTML).to.include('completed task');
    expect(container.innerHTML).to.include('incomplete task');
  });

  it('should support tables', () => {
    const markdown = `| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Row 2    | Data     | More     |`;

    const html = marked(markdown) as string;
    const result = formatText(html);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    expect(container.innerHTML).to.include('<table>');
    expect(container.innerHTML).to.include('<thead>');
    expect(container.innerHTML).to.include('<tbody>');
    expect(container.innerHTML).to.include('<tr>');
    expect(container.innerHTML).to.include('<th>');
    expect(container.innerHTML).to.include('<td>');
    expect(container.innerHTML).to.include('Header 1');
    expect(container.innerHTML).to.include('Cell 1');
  });

  it('should support strikethrough', () => {
    const markdown = 'This is ~~strikethrough~~ text.';

    const html = marked(markdown) as string;
    const result = formatText(html);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    expect(container.innerHTML).to.include('<del>strikethrough</del>');
  });

  it('should support code blocks with language classes', () => {
    const markdown = '```javascript\nconst x = 1;\nconsole.log(x);\n```';

    const html = marked(markdown) as string;
    const result = formatText(html);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    expect(container.innerHTML).to.include('<pre>');
    expect(container.innerHTML).to.include('<code class="language-javascript">');
    expect(container.innerHTML).to.include('const x = 1;');
  });

  it('should strip unsafe attributes while keeping safe ones', () => {
    // Test malicious input
    const maliciousHtml = `
      <table onclick="alert('xss')" class="safe-class">
        <tr>
          <td style="background: red;" colspan="2">Cell</td>
        </tr>
      </table>
      <input type="checkbox" checked disabled onclick="alert('xss')">
    `;

    const result = formatText(maliciousHtml);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    // Should keep safe attributes
    expect(container.innerHTML).to.include('class="safe-class"');
    expect(container.innerHTML).to.include('colspan="2"');
    expect(container.innerHTML).to.include('type="checkbox"');
    expect(container.innerHTML).to.include('checked');
    expect(container.innerHTML).to.include('disabled');

    // Should strip unsafe attributes
    expect(container.innerHTML).to.not.include('onclick');
    expect(container.innerHTML).to.not.include('style');
    expect(container.innerHTML).to.not.include('alert');
  });

  it('should handle complex nested task lists', () => {
    const markdown = `## Todo List

- [x] Main task completed
  - [x] Subtask 1 done
  - [ ] Subtask 2 pending
    - [x] Sub-subtask done
- [ ] Another main task
  - [ ] Its subtask`;

    const html = marked(markdown) as string;
    const result = formatText(html);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    // Should preserve structure and checkboxes
    expect(container.innerHTML).to.include('<h2>Todo List</h2>');
    expect(container.innerHTML).to.include('<ul>');
    expect(container.innerHTML).to.include('<li>');
    expect(container.innerHTML).to.include('input checked="" disabled="" type="checkbox"');
    expect(container.innerHTML).to.include('input disabled="" type="checkbox"');
  });
});
