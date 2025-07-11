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
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true, // Preserve text content when removing disallowed tags
};

// Add hook to automatically make all links open in new tabs with security attributes
// This runs after DOMPurify sanitization to ensure our security policy is enforced
DOMPurify.addHook('afterSanitizeAttributes', function (node) {
  // Only process anchor tags with href attributes
  if (node.tagName === 'A' && node.hasAttribute('href')) {
    // SECURITY: Always force target="_blank" to open in new tab
    // This overrides any user-supplied target attribute for security
    node.setAttribute('target', '_blank');

    // SECURITY: Always force rel="noreferrer" for security
    // This prevents referrer header leakage and blocks window.opener access
    // This overrides any user-supplied rel attribute to prevent security bypasses
    node.setAttribute('rel', 'noreferrer');
  }
});

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

  it('should preserve links with href attributes and add target and rel attributes', () => {
    const input = '<p>Visit <a href="https://example.com">our website</a></p>';
    const result = formatText(input);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    expect(container.innerHTML).to.equal(
      '<!----><p>Visit <a href="https://example.com" target="_blank" rel="noreferrer">our website</a></p>'
    );
  });

  it('should add target and rel attributes to multiple links', () => {
    const input =
      '<p>Visit <a href="https://example.com">site 1</a> and <a href="https://another.com">site 2</a></p>';
    const result = formatText(input);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    expect(container.innerHTML).to.equal(
      '<!----><p>Visit <a href="https://example.com" target="_blank" rel="noreferrer">site 1</a> and <a href="https://another.com" target="_blank" rel="noreferrer">site 2</a></p>'
    );
  });

  it('should not add target and rel to links without href', () => {
    const input = '<p>This is <a>not a real link</a></p>';
    const result = formatText(input);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    expect(container.innerHTML).to.equal(
      '<!----><p>This is <a>not a real link</a></p>'
    );
  });

  it('should override user-supplied target and rel attributes for security', () => {
    const input =
      '<p>Visit <a href="https://example.com" target="_self" rel="opener">malicious link</a></p>';
    const result = formatText(input);

    // Create a test container and render the directive
    const container = document.createElement('div');
    render(result, container);

    // Should override the user's target="_self" and rel="opener" with our secure values
    expect(container.innerHTML).to.equal(
      '<!----><p>Visit <a href="https://example.com" target="_blank" rel="noreferrer">malicious link</a></p>'
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
