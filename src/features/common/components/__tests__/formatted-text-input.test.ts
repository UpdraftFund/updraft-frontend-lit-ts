import { expect, fixture, html } from '@open-wc/testing';
import { FormattedTextInput } from '../formatted-text-input';

describe('FormattedTextInput', () => {
  let element: FormattedTextInput;

  beforeEach(async () => {
    element = await fixture(html`
      <formatted-text-input name="test-input">
        <label slot="label">Test Label</label>
      </formatted-text-input>
    `);
  });

  it('renders correctly', async () => {
    expect(element.shadowRoot).to.exist;

    // Check for the editor element
    const editor = element.shadowRoot?.querySelector('.editor');
    expect(editor).to.exist;
    expect(editor?.getAttribute('contenteditable')).to.equal('true');

    // Check for the label slot
    const labelSlot = element.shadowRoot?.querySelector('slot[name="label"]');
    expect(labelSlot).to.exist;
  });

  it('has correct form-associated properties', () => {
    expect(FormattedTextInput.formAssociated).to.be.true;
    expect(element.form).to.be.null; // Not in a form
    expect(element.type).to.equal('formatted-text-input');
  });

  it('sets and gets value correctly after render', async () => {
    const testValue = '<p>Test <strong>content</strong></p>';

    element.value = testValue;
    await element.updateComplete;

    expect(element.value).to.equal(testValue);

    const editor = element.shadowRoot?.querySelector(
      '.editor'
    ) as HTMLDivElement;
    expect(editor.innerHTML).to.equal(testValue);
  });

  it('sets value before render (saveable-form scenario)', async () => {
    // Create a new element but don't add it to DOM yet
    const newElement = document.createElement(
      'formatted-text-input'
    ) as FormattedTextInput;
    newElement.name = 'test';

    // Set value BEFORE adding to DOM (simulates saveable-form behavior)
    const testValue = '<p>Early <em>value</em> setting</p>';
    newElement.value = testValue;

    // Now add to DOM and wait for rendering
    document.body.appendChild(newElement);
    await newElement.updateComplete;

    // Value should be preserved
    expect(newElement.value).to.equal(testValue);

    const editor = newElement.shadowRoot?.querySelector(
      '.editor'
    ) as HTMLDivElement;
    expect(editor.innerHTML).to.equal(testValue);

    // Clean up
    document.body.removeChild(newElement);
  });

  it('handles required validation', async () => {
    element.required = true;
    await element.updateComplete;

    // Empty value should be invalid
    element.value = '';
    expect(element.validity.valid).to.be.false;
    expect(element.validity.valueMissing).to.be.true;

    // Non-empty value should be valid
    element.value = '<p>Some content</p>';
    expect(element.validity.valid).to.be.true;
    expect(element.validity.valueMissing).to.be.false;
  });

  it('handles disabled state', async () => {
    element.disabled = true;
    await element.updateComplete;

    const editor = element.shadowRoot?.querySelector('.editor');
    expect(editor?.getAttribute('contenteditable')).to.equal('false');
  });

  it('integrates with forms', async () => {
    const form = await fixture(html`
      <form>
        <formatted-text-input name="description" required>
          <label slot="label">Description</label>
        </formatted-text-input>
      </form>
    `);

    const input = form.querySelector(
      'formatted-text-input'
    ) as FormattedTextInput;
    expect(input.form).to.equal(form);

    // Test form data
    input.value = '<p>Form content</p>';
    await input.updateComplete;

    const formData = new FormData(form as HTMLFormElement);
    expect(formData.get('description')).to.equal('<p>Form content</p>');
  });

  it('handles form state restoration', async () => {
    const testValue = '<p>Restored <strong>content</strong></p>';

    // Simulate form state restoration
    element.formStateRestoreCallback(testValue);
    await element.updateComplete;

    expect(element.value).to.equal(testValue);

    const editor = element.shadowRoot?.querySelector(
      '.editor'
    ) as HTMLDivElement;
    expect(editor.innerHTML).to.equal(testValue);
  });

  it('handles form reset', async () => {
    element.value = '<p>Some content</p>';
    await element.updateComplete;

    element.formResetCallback();
    await element.updateComplete;

    expect(element.value).to.equal('');
    expect(element.validity.valid).to.be.true;
  });

  it('dispatches change events on input', async () => {
    let changeEventFired = false;
    element.addEventListener('change', () => {
      changeEventFired = true;
    });

    const editor = element.shadowRoot?.querySelector(
      '.editor'
    ) as HTMLDivElement;

    // Simulate input
    editor.innerHTML = '<p>New content</p>';
    editor.dispatchEvent(new Event('input', { bubbles: true }));

    expect(changeEventFired).to.be.true;
    expect(element.value).to.equal('<p>New content</p>');
  });

  it('handles multiple rapid value changes', async () => {
    // Test that rapid value changes don't cause issues
    const values = [
      '<p>First</p>',
      '<p>Second <strong>bold</strong></p>',
      '<p>Third <em>italic</em></p>',
    ];

    for (const value of values) {
      element.value = value;
    }

    await element.updateComplete;

    // Should have the last value
    expect(element.value).to.equal(values[values.length - 1]);

    const editor = element.shadowRoot?.querySelector(
      '.editor'
    ) as HTMLDivElement;
    expect(editor.innerHTML).to.equal(values[values.length - 1]);
  });
});
