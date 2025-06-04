import { expect } from '@open-wc/testing';
import { sanitizeRichText } from './sanitize.js';

describe('sanitizeRichTextContent', () => {
  it('should preserve allowed formatting tags', () => {
    const input = '<p>Hello <strong>world</strong> with <em>emphasis</em>!</p>';
    const result = sanitizeRichText(input);
    expect(result).to.equal(
      '<p>Hello <strong>world</strong> with <em>emphasis</em>!</p>'
    );
  });

  it('should remove dangerous script tags and their content', () => {
    const input = '<p>Hello <script>alert("xss")</script> world!</p>';
    const result = sanitizeRichText(input);
    expect(result).to.equal('<p>Hello  world!</p>');
  });

  it('should preserve links with href attributes', () => {
    const input = '<p>Visit <a href="https://example.com">our website</a></p>';
    const result = sanitizeRichText(input);
    expect(result).to.equal(
      '<p>Visit <a href="https://example.com">our website</a></p>'
    );
  });

  it('should remove dangerous attributes but keep content', () => {
    const input = '<p onclick="alert(1)">Click me</p>';
    const result = sanitizeRichText(input);
    expect(result).to.equal('<p>Click me</p>');
  });

  it('should preserve lists', () => {
    const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const result = sanitizeRichText(input);
    expect(result).to.equal('<ul><li>Item 1</li><li>Item 2</li></ul>');
  });

  it('should remove disallowed tags but keep content', () => {
    const input =
      '<div><span>Hello</span> <custom-tag>world</custom-tag></div>';
    const result = sanitizeRichText(input);
    expect(result).to.equal('Hello world');
  });
});
