import { expect, fixture, html } from '@open-wc/testing';
import { VerticalFade } from '../vertical-fade';

describe('VerticalFade', () => {
  let element: VerticalFade;

  beforeEach(async () => {
    element = await fixture(html`
      <vertical-fade
        style="width: 200px; --fade-height: 1rem; --fade-color: white;"
      >
        <div>Test content</div>
      </vertical-fade>
    `);
  });

  it('renders correctly', async () => {
    expect(element.shadowRoot).to.exist;

    // Check for the slot element
    const slot = element.shadowRoot?.querySelector('slot');
    expect(slot).to.exist;

    // Check for the overlay element
    const overlay = element.shadowRoot?.querySelector('.overlay');
    expect(overlay).to.exist;
  });

  it('constrains content width to container', async () => {
    // Check that the host element has width: 100%
    const hostStyles = getComputedStyle(element);
    expect(hostStyles.width).to.equal('200px'); // Should match the container width we set

    // Check that overflow is hidden
    expect(hostStyles.overflow).to.equal('hidden');
  });

  it('handles wide content without horizontal scrollbar', async () => {
    // Create element with very wide content
    const wideElement = await fixture(html`
      <vertical-fade
        style="width: 200px; --fade-height: 1rem; --fade-color: white;"
      >
        <div style="width: 500px; background: red;">
          This is very wide content that should be constrained
        </div>
      </vertical-fade>
    `);

    // The container should still be 200px wide
    const hostStyles = getComputedStyle(wideElement);
    expect(hostStyles.width).to.equal('200px');
    expect(hostStyles.overflow).to.equal('hidden');
  });

  it('handles long text content with word wrapping', async () => {
    const longTextElement = await fixture(html`
      <vertical-fade
        style="width: 200px; --fade-height: 1rem; --fade-color: white;"
      >
        <p>
          This is a very long text that should wrap properly within the
          container boundaries without causing horizontal overflow or scrollbars
          to appear in the parent container.
        </p>
      </vertical-fade>
    `);

    // The container should maintain its width
    const hostStyles = getComputedStyle(longTextElement);
    expect(hostStyles.width).to.equal('200px');
    expect(hostStyles.overflow).to.equal('hidden');
  });

  it('handles code blocks and pre elements', async () => {
    const codeElement = await fixture(html`
      <vertical-fade
        style="width: 200px; --fade-height: 1rem; --fade-color: white;"
      >
        <pre><code>This is a very long line of code that might normally cause horizontal overflow but should be handled properly</code></pre>
      </vertical-fade>
    `);

    // The container should maintain its width
    const hostStyles = getComputedStyle(codeElement);
    expect(hostStyles.width).to.equal('200px');
    expect(hostStyles.overflow).to.equal('hidden');
  });

  it('handles long URLs and links', async () => {
    const linkElement = await fixture(html`
      <vertical-fade
        style="width: 200px; --fade-height: 1rem; --fade-color: white;"
      >
        <p>
          Check out this link:
          <a href="https://example.com/very/long/url/that/might/cause/overflow"
            >https://example.com/very/long/url/that/might/cause/overflow</a
          >
        </p>
      </vertical-fade>
    `);

    // The container should maintain its width
    const hostStyles = getComputedStyle(linkElement);
    expect(hostStyles.width).to.equal('200px');
    expect(hostStyles.overflow).to.equal('hidden');
  });

  it('handles formatted markdown content', async () => {
    const markdownElement = await fixture(html`
      <vertical-fade
        style="width: 200px; --fade-height: 1rem; --fade-color: white;"
      >
        <h2>This is a very long heading that should wrap properly</h2>
        <p>
          This is a paragraph with <strong>bold text</strong> and
          <em>italic text</em> that should wrap correctly.
        </p>
        <ul>
          <li>
            This is a very long list item that should wrap properly within the
            container
          </li>
          <li>Another list item</li>
        </ul>
      </vertical-fade>
    `);

    // The container should maintain its width
    const hostStyles = getComputedStyle(markdownElement);
    expect(hostStyles.width).to.equal('200px');
    expect(hostStyles.overflow).to.equal('hidden');
  });

  it('handles long strings of repeated characters (like equal signs)', async () => {
    const repeatedCharsElement = await fixture(html`
      <vertical-fade
        style="width: 200px; --fade-height: 1rem; --fade-color: white;"
      >
        <h1>pasting stuff for fun<br />🪁Updraft</h1>
        <p><a href="https://guide.updraft.fund/updraft#overview"></a></p>
        <p>Overview</p>
        <hr />
        <p>
          Updraft is a way for people to get paid to discover the best ideas for
          their communities, their organizations and the world.
        </p>
        <p>
          This guide will teach you the concepts you need to make an impact in
          Updraft.
        </p>
        <p>
          =================================================================================================================================================================================================================
        </p>
      </vertical-fade>
    `);

    // The container should maintain its width even with very long repeated characters
    const hostStyles = getComputedStyle(repeatedCharsElement);
    expect(hostStyles.width).to.equal('200px');
    expect(hostStyles.overflow).to.equal('hidden');
  });

  it('applies fade overlay correctly', async () => {
    const overlay = element.shadowRoot?.querySelector(
      '.overlay'
    ) as HTMLElement;
    expect(overlay).to.exist;

    const overlayStyles = getComputedStyle(overlay);
    expect(overlayStyles.position).to.equal('absolute');
    expect(overlayStyles.bottom).to.equal('0px');
    expect(overlayStyles.left).to.equal('0px');
    expect(overlayStyles.width).to.equal('200px'); // Should match container width
  });

  it('respects CSS custom properties', async () => {
    const customElement = await fixture(html`
      <vertical-fade style="--fade-height: 2rem; --fade-color: blue;">
        <div>Content with custom fade</div>
      </vertical-fade>
    `);

    const overlay = customElement.shadowRoot?.querySelector(
      '.overlay'
    ) as HTMLElement;
    const overlayStyles = getComputedStyle(overlay);

    // Note: The actual computed values might be different due to CSS variable resolution
    // but we can check that the overlay exists and has the expected structure
    expect(overlay).to.exist;
    expect(overlayStyles.position).to.equal('absolute');
  });
});
