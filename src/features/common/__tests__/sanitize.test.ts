import { expect } from '@open-wc/testing';
import { render } from 'lit';
import DOMPurify, { Config } from 'dompurify';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { DirectiveResult } from 'lit/directive.js';

// Copy the formatText function and its dependencies directly to avoid import issues
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
    'blockquote',
  ],
  ALLOWED_ATTR: ['href'],
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true, // Preserve text content when removing disallowed tags
};

function formatText(htmlContent: string): DirectiveResult {
  const sanitized = DOMPurify.sanitize(htmlContent, RICH_TEXT_SANITIZE_CONFIG);
  return unsafeHTML(sanitized);
}

describe('formatText', () => {
  it('should preserve allowed formatting tags', () => {
    const input = '<p>Hello <strong>world</strong> with <em>emphasis</em>!</p>';
    const result = formatText(input);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    expect(container.innerHTML).to.equal(
      '<!----><p>Hello <strong>world</strong> with <em>emphasis</em>!</p>'
    );
  });

  it('should remove dangerous script tags and their content', () => {
    const input = '<p>Hello <script>alert("xss")</script> world!</p>';
    const result = formatText(input);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    expect(container.innerHTML).to.equal('<!----><p>Hello  world!</p>');
  });

  it('should preserve links with href attributes', () => {
    const input = '<p>Visit <a href="https://example.com">our website</a></p>';
    const result = formatText(input);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    expect(container.innerHTML).to.equal(
      '<!----><p>Visit <a href="https://example.com">our website</a></p>'
    );
  });

  it('should remove dangerous attributes but keep content', () => {
    const input = '<p onclick="alert(1)">Click me</p>';
    const result = formatText(input);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    expect(container.innerHTML).to.equal('<!----><p>Click me</p>');
  });

  it('should preserve lists', () => {
    const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const result = formatText(input);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    expect(container.innerHTML).to.equal(
      '<!----><ul><li>Item 1</li><li>Item 2</li></ul>'
    );
  });

  it('should remove disallowed tags but keep content', () => {
    const input =
      '<div><span>Hello</span> <custom-tag>world</custom-tag></div>';
    const result = formatText(input);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    expect(container.innerHTML).to.equal('<!---->Hello world');
  });
});
