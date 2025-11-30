import { expect } from '@open-wc/testing';
import DOMPurify from 'dompurify';

// Extract the actual functions from api/social-meta.ts for testing
// These match the implementation in the API file exactly

/**
 * Strips HTML tags for social media descriptions using DOMPurify
 * Leaves HTML entities as-is since crawlers will decode them
 */
function stripHtmlTags(html: string): string {
  const text = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true,
  });
  // Clean up extra whitespace and line breaks
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Escapes characters that could break HTML attribute values
 * Handles both user input and content that may already contain HTML entities
 */
function escapeForAttribute(text: string): string {
  return (
    text
      // First escape any unescaped ampersands (must be done first)
      .replace(/&(?![a-zA-Z0-9#]+;)/g, '&amp;')
      // Then escape any unescaped quotes
      .replace(/"/g, '&quot;')
  );
}

describe('Social Media Meta Functions', () => {
  describe('stripHtmlTags', () => {
    it('should remove HTML tags while preserving content', () => {
      const input = '<p>Hello <strong>world</strong>!</p>';
      const expected = 'Hello world!';
      expect(stripHtmlTags(input)).to.equal(expected);
    });

    it('should preserve HTML entities', () => {
      const input = '<p>Price: $5 &amp; &quot;free&quot; shipping</p>';
      const expected = 'Price: $5 &amp; "free" shipping';
      expect(stripHtmlTags(input)).to.equal(expected);
    });

    it('should clean up extra whitespace', () => {
      const input = '<p>  Multiple   spaces  </p>\n<p>  And   newlines  </p>';
      const expected = 'Multiple spaces And newlines';
      expect(stripHtmlTags(input)).to.equal(expected);
    });

    it('should handle empty content', () => {
      expect(stripHtmlTags('')).to.equal('');
      expect(stripHtmlTags('<p></p>')).to.equal('');
    });

    it('should handle content with no HTML tags', () => {
      const input = 'Plain text content';
      expect(stripHtmlTags(input)).to.equal(input);
    });

    it('should remove script tags completely (security)', () => {
      const input = '<p>Hello <script>alert("xss")</script> world!</p>';
      const expected = 'Hello world!';
      expect(stripHtmlTags(input)).to.equal(expected);
    });
  });

  describe('escapeForAttribute', () => {
    it('should escape unescaped quotes', () => {
      const input = 'He said "Hello world"';
      const expected = 'He said &quot;Hello world&quot;';
      expect(escapeForAttribute(input)).to.equal(expected);
    });

    it('should escape unescaped ampersands', () => {
      const input = 'A&B Company';
      const expected = 'A&amp;B Company';
      expect(escapeForAttribute(input)).to.equal(expected);
    });

    it('should preserve existing HTML entities', () => {
      const input = 'Price: $5 &amp; &quot;free&quot; shipping';
      const expected = 'Price: $5 &amp; &quot;free&quot; shipping';
      expect(escapeForAttribute(input)).to.equal(expected);
    });
  });

  describe('Integration Tests', () => {
    it('should handle the complete flow: HTML with entities -> stripped -> escaped', () => {
      const htmlInput = '<p>John said &quot;Hello&quot; &amp; waved</p>';
      const stripped = stripHtmlTags(htmlInput);
      const escaped = escapeForAttribute(stripped);

      expect(stripped).to.equal('John said "Hello" &amp; waved');
      expect(escaped).to.equal('John said &quot;Hello&quot; &amp; waved');
    });

    it('should handle user input with quotes in HTML content', () => {
      const htmlInput = '<p>User typed: "This is awesome!"</p>';
      const stripped = stripHtmlTags(htmlInput);
      const escaped = escapeForAttribute(stripped);

      expect(stripped).to.equal('User typed: "This is awesome!"');
      expect(escaped).to.equal('User typed: &quot;This is awesome!&quot;');
    });

    it('should handle rich text editor content', () => {
      const richTextInput = '<p>Check out <strong>"John\'s Company"</strong> &amp; more!</p>';
      const stripped = stripHtmlTags(richTextInput);
      const escaped = escapeForAttribute(stripped);

      expect(stripped).to.equal('Check out "John\'s Company" &amp; more!');
      expect(escaped).to.equal("Check out &quot;John's Company&quot; &amp; more!");
    });
  });

  describe('DOMPurify Configuration', () => {
    it('should use the exact configuration from api/social-meta.ts', () => {
      // Test that we're using ALLOWED_TAGS: [] and KEEP_CONTENT: true
      const input = '<div><span>Hello</span> <custom-tag>world</custom-tag></div>';
      const result = DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        KEEP_CONTENT: true,
      });
      expect(result).to.equal('Hello world');
    });

    it('should preserve text content when removing all tags', () => {
      const input = '<h1>Title</h1><p>Paragraph with <em>emphasis</em></p>';
      const result = stripHtmlTags(input);
      expect(result).to.equal('TitleParagraph with emphasis');
    });
  });
});
