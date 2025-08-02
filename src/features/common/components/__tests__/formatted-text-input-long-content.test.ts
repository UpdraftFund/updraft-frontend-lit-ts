import { expect, fixture, html } from '@open-wc/testing';
import { FormattedTextInput } from '../formatted-text-input';

describe('FormattedTextInput - Long Content', () => {
  let element: FormattedTextInput;

  beforeEach(async () => {
    element = await fixture(html`
      <formatted-text-input name="test-input">
        <label slot="label">Test Label</label>
      </formatted-text-input>
    `);
  });

  it('handles content longer than 2500 characters without truncation', async () => {
    // Create content that's longer than 2500 characters
    const longContent = '<p>' + 'A'.repeat(3000) + '</p>';

    element.value = longContent;
    await element.updateComplete;

    // The component should preserve the full content
    expect(element.value).to.equal(longContent);
    expect(element.value.length).to.be.greaterThan(2500);

    const editor = element.shadowRoot?.querySelector(
      '.editor'
    ) as HTMLDivElement;
    expect(editor.innerHTML).to.equal(longContent);
  });

  it('handles very long HTML content with formatting', async () => {
    // Create complex HTML content longer than 2500 characters
    const paragraphs = [];
    for (let i = 0; i < 50; i++) {
      paragraphs.push(
        `<p>This is paragraph ${i + 1} with <strong>bold text</strong> and <em>italic text</em>. ${'X'.repeat(50)}</p>`
      );
    }
    const longHtmlContent = paragraphs.join('');

    element.value = longHtmlContent;
    await element.updateComplete;

    // The component should preserve the full content
    expect(element.value).to.equal(longHtmlContent);
    expect(element.value.length).to.be.greaterThan(2500);

    const editor = element.shadowRoot?.querySelector(
      '.editor'
    ) as HTMLDivElement;
    expect(editor.innerHTML).to.equal(longHtmlContent);
  });

  it('handles form submission with long content', async () => {
    const form = await fixture(html`
      <form>
        <formatted-text-input name="description">
          <label slot="label">Description</label>
        </formatted-text-input>
      </form>
    `);

    const input = form.querySelector(
      'formatted-text-input'
    ) as FormattedTextInput;

    // Set content longer than 2500 characters
    const longContent = '<p>' + 'B'.repeat(3000) + '</p>';
    input.value = longContent;
    await input.updateComplete;

    // Form data should contain the full content
    const formData = new FormData(form as HTMLFormElement);
    const formValue = formData.get('description') as string;

    expect(formValue).to.equal(longContent);
    expect(formValue.length).to.be.greaterThan(2500);
  });

  it('handles input events with long content', async () => {
    let inputEventValue = '';
    element.addEventListener('input', (e: Event) => {
      const customEvent = e as CustomEvent;
      inputEventValue = customEvent.detail.value;
    });

    const editor = element.shadowRoot?.querySelector(
      '.editor'
    ) as HTMLDivElement;

    // Simulate typing long content
    const longContent = '<p>' + 'C'.repeat(3000) + '</p>';
    editor.innerHTML = longContent;
    editor.dispatchEvent(new Event('input', { bubbles: true }));

    expect(inputEventValue).to.equal(longContent);
    expect(inputEventValue.length).to.be.greaterThan(2500);
    expect(element.value).to.equal(longContent);
  });
});
