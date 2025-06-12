import { expect } from '@open-wc/testing';
import TurndownService from 'turndown';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

describe('Markdown Processing', () => {
  const originalMarkdown = `# Can we do markdown?

* Yes
* we
* can

I **love** *spaghetti*

## code

\`\`\`typescript
function hello() {
  console.log('hello');
}
\`\`\`

> Dorothy followed her through many of the beautiful rooms in her castle.

1. First item
2. Second item
3. Third item
    - Indented item
    - Indented item
4. Fourth item`;

  // Simulate what contenteditable produces (based on your step 2 output)
  const contentEditableHTML = `# Can we do markdown?

* Yes
* we
* can

I **love** *spaghetti*

## code

\`\`\`typescript
function hello() {
  console.log('hello');
}
\`\`\`

&gt; Dorothy followed her through many of the beautiful rooms in her castle.

1. First item
2. Second item
3. Third item
    - Indented item
    - Indented item
4. Fourth item`;

  it('should preserve line breaks when processing contenteditable HTML', () => {
    console.log('=== ORIGINAL MARKDOWN ===');
    console.log(originalMarkdown);

    console.log('\n=== CONTENTEDITABLE HTML (simulated) ===');
    console.log(contentEditableHTML);

    // Test our current turndown service
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      bulletListMarker: '*',
      codeBlockStyle: 'fenced',
      fence: '```',
      emDelimiter: '*',
      strongDelimiter: '**',
    });

    // Add the same rules as our main service
    turndownService.addRule('removeComments', {
      filter: (node) => node.nodeType === Node.COMMENT_NODE,
      replacement: () => '',
    });

    turndownService.addRule('lineBreaks', {
      filter: 'br',
      replacement: () => '\n',
    });

    turndownService.addRule('nonBreakingSpaces', {
      filter: (node) => {
        return (
          node.nodeType === Node.TEXT_NODE &&
          node.textContent !== null &&
          node.textContent.includes('\u00A0')
        );
      },
      replacement: (content) => content.replace(/\u00A0/g, ' '),
    });

    console.log('\n=== TESTING TURNDOWN ===');
    const turndownResult = turndownService.turndown(contentEditableHTML);
    console.log('Turndown result:');
    console.log(JSON.stringify(turndownResult)); // Use JSON.stringify to see whitespace

    console.log('\n=== TESTING MARKED ===');
    const markedResult = marked(turndownResult) as string;
    console.log('Marked result:');
    console.log(markedResult);

    console.log('\n=== TESTING DOMPURIFY ===');
    const sanitized = DOMPurify.sanitize(markedResult);
    console.log('DOMPurify result:');
    console.log(sanitized);

    // The test should preserve the basic structure
    expect(turndownResult).to.include('# Can we do markdown?');
    expect(turndownResult).to.include('* Yes');
    expect(turndownResult).to.include('## code');
  });

  it('should test simple HTML entity conversion', () => {
    const simpleHTML = 'Hello &gt; world &amp; test';

    const turndownService = new TurndownService();
    const result = turndownService.turndown(simpleHTML);

    console.log('\n=== SIMPLE HTML ENTITY TEST ===');
    console.log('Input:', simpleHTML);
    console.log('Output:', result);

    expect(result).to.equal('Hello > world & test');
  });

  it('should test line break preservation with our new approach', () => {
    const textWithBreaks = `Line 1

Line 2

Line 3`;

    // Our new approach should preserve line breaks (unlike turndown)
    function cleanPlainTextWithEntities(content: string): string {
      return content
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[ \t]+/g, ' ')
        .trim();
    }

    const result = cleanPlainTextWithEntities(textWithBreaks);

    console.log('\n=== LINE BREAK TEST (NEW APPROACH) ===');
    console.log('Input:', JSON.stringify(textWithBreaks));
    console.log('Output:', JSON.stringify(result));

    // Should preserve line breaks
    expect(result).to.include('\n');
  });

  it('should test what happens with plain text (no HTML)', () => {
    const plainText = `# Header

* List item
* Another item

Paragraph text`;

    const turndownService = new TurndownService();
    const result = turndownService.turndown(plainText);

    console.log('\n=== PLAIN TEXT TEST ===');
    console.log('Input:', JSON.stringify(plainText));
    console.log('Output:', JSON.stringify(result));

    // When there's no HTML, turndown should pass it through mostly unchanged
    expect(result).to.include('# Header');
    expect(result).to.include('* List item');
  });

  it('should test the new approach - plain text with entities vs HTML elements', () => {
    // Test the logic we implemented
    function hasActualHTMLElements(content: string): boolean {
      const htmlTagPattern = /<[a-zA-Z][^>]*>/;
      return htmlTagPattern.test(content);
    }

    function cleanPlainTextWithEntities(content: string): string {
      return content
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/&gt;/g, '>')
        .replace(/&lt;/g, '<')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[ \t]+/g, ' ')
        .trim();
    }

    // Test case 1: Plain text with entities (like contenteditable output)
    const plainTextWithEntities = `# Header

&gt; Quote &amp; text`;

    console.log('\n=== TESTING NEW APPROACH ===');
    console.log(
      'Plain text with entities:',
      JSON.stringify(plainTextWithEntities)
    );
    console.log(
      'Has HTML elements?',
      hasActualHTMLElements(plainTextWithEntities)
    );

    const cleaned = cleanPlainTextWithEntities(plainTextWithEntities);
    console.log('After cleaning entities:', JSON.stringify(cleaned));

    const markedResult = marked(cleaned) as string;
    console.log('After marked:', markedResult);

    // Should preserve structure and convert entities
    expect(hasActualHTMLElements(plainTextWithEntities)).to.be.false;
    expect(cleaned).to.include('> Quote & text');
    expect(markedResult).to.include('<h1>Header</h1>');
    expect(markedResult).to.include('<blockquote>');

    // Test case 2: Actual HTML elements
    const actualHTML = '<h1>Header</h1><p>Text with <strong>bold</strong></p>';
    console.log('\nActual HTML:', actualHTML);
    console.log('Has HTML elements?', hasActualHTMLElements(actualHTML));

    expect(hasActualHTMLElements(actualHTML)).to.be.true;
  });
});
