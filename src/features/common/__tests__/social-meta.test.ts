import { expect } from '@open-wc/testing';

// Since the social-meta.ts file is in api/, we need to extract the functions for testing
// Let's create isolated versions of the functions for testing

/**
 * Strips HTML tags for social media descriptions
 * Leaves HTML entities as-is since crawlers will decode them
 */
function stripHtmlTags(html: string): string {
  // Remove HTML tags but preserve content and entities
  let text = html.replace(/<[^>]*>/g, '');

  // Clean up extra whitespace and line breaks
  text = text.replace(/\s+/g, ' ').trim();

  return text;
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
      const expected = 'Price: $5 &amp; &quot;free&quot; shipping';
      expect(stripHtmlTags(input)).to.equal(expected);
    });

    it('should handle complex HTML with multiple tags', () => {
      const input =
        '<div><h1>Title</h1><p>Check out <em>this</em> <a href="#">link</a></p></div>';
      const expected = 'TitleCheck out this link';
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
      expect(stripHtmlTags('<div>   </div>')).to.equal('');
    });

    it('should handle content with no HTML tags', () => {
      const input = 'Plain text content';
      expect(stripHtmlTags(input)).to.equal(input);
    });

    it('should preserve common HTML entities', () => {
      const input =
        '<p>&amp; &lt; &gt; &quot; &#039; &nbsp; &hellip; &mdash;</p>';
      const expected = '&amp; &lt; &gt; &quot; &#039; &nbsp; &hellip; &mdash;';
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

    it('should handle mixed content correctly', () => {
      const input = 'John\'s "Company" & Co. &amp; more';
      const expected = "John's &quot;Company&quot; &amp; Co. &amp; more";
      expect(escapeForAttribute(input)).to.equal(expected);
    });

    it('should handle empty content', () => {
      expect(escapeForAttribute('')).to.equal('');
    });

    it('should handle content with no special characters', () => {
      const input = 'Regular text content';
      expect(escapeForAttribute(input)).to.equal(input);
    });

    it('should preserve various HTML entities', () => {
      const input = '&lt; &gt; &nbsp; &hellip; &mdash; &ndash;';
      const expected = '&lt; &gt; &nbsp; &hellip; &mdash; &ndash;';
      expect(escapeForAttribute(input)).to.equal(expected);
    });

    it('should handle edge cases with ampersands', () => {
      // Standalone ampersand
      expect(escapeForAttribute('A & B')).to.equal('A &amp; B');

      // Ampersand at end
      expect(escapeForAttribute('Company &')).to.equal('Company &amp;');

      // Multiple ampersands
      expect(escapeForAttribute('A & B & C')).to.equal('A &amp; B &amp; C');
    });
  });

  describe('Security Tests', () => {
    it('should prevent HTML injection attacks', () => {
      const maliciousInput = '" /><script>alert("XSS")</script><meta content="';
      const escaped = escapeForAttribute(maliciousInput);

      // Should escape all quotes to prevent breaking out of attribute
      expect(escaped).to.not.include('"/>');
      expect(escaped).to.include('&quot;');

      // The result should be safe when used in an attribute
      const expectedResult =
        '&quot; /><script>alert(&quot;XSS&quot;)</script><meta content=&quot;';
      expect(escaped).to.equal(expectedResult);
    });

    it('should prevent attribute injection attacks', () => {
      const maliciousInput = '" onload="alert(\'XSS\')" data-evil="';
      const escaped = escapeForAttribute(maliciousInput);

      // Should escape all quotes
      expect(escaped).to.equal(
        "&quot; onload=&quot;alert('XSS')&quot; data-evil=&quot;"
      );
    });

    it('should handle complex XSS attempts', () => {
      const maliciousInput = '"><img src=x onerror=alert(1)>';
      const escaped = escapeForAttribute(maliciousInput);

      // Should escape the quote but leave other characters (they're safe in attributes)
      expect(escaped).to.equal('&quot;><img src=x onerror=alert(1)>');
    });
  });

  describe('Integration Tests', () => {
    it('should handle the complete flow: HTML with entities -> stripped -> escaped', () => {
      const htmlInput = '<p>John said &quot;Hello&quot; &amp; waved</p>';
      const stripped = stripHtmlTags(htmlInput);
      const escaped = escapeForAttribute(stripped);

      expect(stripped).to.equal('John said &quot;Hello&quot; &amp; waved');
      expect(escaped).to.equal('John said &quot;Hello&quot; &amp; waved');
    });

    it('should handle user input with quotes in HTML content', () => {
      const htmlInput = '<p>User typed: "This is awesome!"</p>';
      const stripped = stripHtmlTags(htmlInput);
      const escaped = escapeForAttribute(stripped);

      expect(stripped).to.equal('User typed: "This is awesome!"');
      expect(escaped).to.equal('User typed: &quot;This is awesome!&quot;');
    });

    it('should handle formatted text from rich text editor', () => {
      const richTextInput =
        '<p>Check out <strong>"John\'s Company"</strong> &amp; more!</p>';
      const stripped = stripHtmlTags(richTextInput);
      const escaped = escapeForAttribute(stripped);

      expect(stripped).to.equal('Check out "John\'s Company" &amp; more!');
      expect(escaped).to.equal(
        "Check out &quot;John's Company&quot; &amp; more!"
      );
    });
  });

  describe('Performance Tests', () => {
    it('should handle large content efficiently', () => {
      // Create a large HTML string
      const largeContent =
        '<p>' + 'A'.repeat(1000) + ' &amp; ' + 'B'.repeat(1000) + '</p>';

      const start = performance.now();
      const stripped = stripHtmlTags(largeContent);
      const escaped = escapeForAttribute(stripped);
      const end = performance.now();

      // Should complete in reasonable time (less than 10ms for this size)
      expect(end - start).to.be.lessThan(10);

      // Should produce correct result
      expect(stripped).to.include('A'.repeat(1000));
      expect(stripped).to.include('&amp;');
      expect(escaped).to.include('A'.repeat(1000));
    });
  });
});
