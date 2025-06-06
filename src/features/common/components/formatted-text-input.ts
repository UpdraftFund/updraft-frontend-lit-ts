import { LitElement, css, html } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';

/**
 * Formatted text input component that preserves pasted formatting
 * Uses contenteditable div to allow rich text paste while integrating with forms
 * Implements Form-Associated Custom Elements API for proper form integration
 */
@customElement('formatted-text-input')
export class FormattedTextInput extends SignalWatcher(LitElement) {
  static formAssociated = true;
  static styles = css`
    :host {
      display: block;
    }

    .form-control {
      display: flex;
      flex-direction: column;
    }

    .form-control-label {
      margin-bottom: 0;
    }

    .editor {
      min-height: 100px;
      padding: 0.75rem;
      border: 1px solid var(--sl-input-border-color);
      border-radius: var(--sl-input-border-radius-medium);
      font-size: var(--sl-input-font-size-medium);
      color: var(--sl-input-color);
      outline: none;
      overflow: hidden;
      transition:
        var(--sl-transition-fast) color,
        var(--sl-transition-fast) border,
        var(--sl-transition-fast) box-shadow;
    }

    .editor:focus {
      border-color: var(--sl-input-border-color-focus);
      box-shadow: 0 0 0 var(--sl-focus-ring-width)
        var(--sl-input-focus-ring-color);
    }

    .editor p {
      margin: 0 0 1em 0;
    }

    .editor p:last-child {
      margin-bottom: 0;
    }

    .editor ul,
    .editor ol {
      margin: 0 0 1em 0;
      padding-left: 1.5em;
    }

    .editor li {
      margin-bottom: 0.25em;
    }

    .editor a {
      color: var(--sl-color-primary-600);
      text-decoration: underline;
    }

    .editor strong,
    .editor b {
      font-weight: bold;
    }

    .editor em,
    .editor i {
      font-style: italic;
    }

    .editor u {
      text-decoration: underline;
    }

    .editor h1,
    .editor h2,
    .editor h3,
    .editor h4,
    .editor h5,
    .editor h6 {
      margin: 0 0 0.5em 0;
      font-weight: bold;
    }

    .editor h1 {
      font-size: 1.5em;
    }
    .editor h2 {
      font-size: 1.3em;
    }
    .editor h3 {
      font-size: 1.1em;
    }

    .editor blockquote {
      margin: 0 0 1em 0;
      padding-left: 1em;
      border-left: 3px solid var(--sl-color-neutral-300);
      color: var(--sl-color-neutral-600);
    }
  `;

  @property() name = '';
  @property({ type: Boolean }) required = false;
  @property({ type: Boolean }) disabled = false;
  @property()
  get value() {
    return this._value;
  }

  set value(value: string) {
    this._value = value;
    if (this.editor) {
      this.editor.innerHTML = value;
      setTimeout(() => this.autoResize(), 0);
    } else {
      // If editor is not yet available, wait for it to be rendered
      this.updateComplete.then(() => {
        if (this.editor && this._value === value) {
          this.editor.innerHTML = value;
          setTimeout(() => this.autoResize(), 0);
        }
      });
    }
    // Update form value when value changes
    if (this.internals) {
      this.internals.setFormValue(value);
      this.updateValidity();
    }
  }

  @state() private _value = '';
  @state() private _validationMessage = '';

  @query('.editor', true) editor!: HTMLDivElement;

  // Form-associated custom element internals
  private internals: ElementInternals;

  constructor() {
    super();
    // Attach internals for form association
    this.internals = this.attachInternals();
  }

  // Form control API methods
  get form() {
    return this.internals.form;
  }

  get type() {
    return this.localName;
  }

  get validity() {
    return this.internals.validity;
  }

  get validationMessage() {
    return this.internals.validationMessage;
  }

  get willValidate() {
    return this.internals.willValidate;
  }

  checkValidity() {
    return this.internals.checkValidity();
  }

  reportValidity() {
    return this.internals.reportValidity();
  }

  private updateValidity() {
    // Check if the field is required and empty
    if (
      this.required &&
      (!this._value || this._value.trim() === '' || this._value === '<br><br>')
    ) {
      this._validationMessage = 'This field is required';
      this.internals.setValidity(
        { valueMissing: true },
        this._validationMessage,
        this.editor
      );
    } else {
      this._validationMessage = '';
      this.internals.setValidity({});
    }
    this.internals.setFormValue(this._value);
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  private handleInput() {
    const content = this.editor.innerHTML;
    this._value = content;

    // Update form value and validity
    this.internals.setFormValue(content);
    this.updateValidity();

    // Auto-resize the editor to fit content
    this.autoResize();

    // Dispatch input event for form validation
    this.dispatchEvent(
      new CustomEvent('input', {
        detail: { value: content },
        bubbles: true,
        composed: true,
      })
    );
  }

  private autoResize() {
    // Reset height to auto to get the natural height
    this.editor.style.height = 'auto';

    // Set height to scrollHeight to fit all content - no max height limit
    const scrollHeight = this.editor.scrollHeight;
    const minHeight = 100; // Match the min-height in CSS

    const newHeight = Math.max(minHeight, scrollHeight);
    this.editor.style.height = `${newHeight}px`;

    // Never show scroll bars - always fit content
    this.editor.style.overflowY = 'hidden';
  }

  private handlePaste() {
    // Allow default paste behavior to preserve formatting
    // The contenteditable div will automatically handle rich text paste
    setTimeout(() => {
      this.handleInput();
      // Additional resize after paste to handle large content
      setTimeout(() => this.autoResize(), 10);
    }, 0);
  }

  private handleKeyDown(e: KeyboardEvent) {
    // Handle Enter key to create proper paragraphs
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertHTML', false, '<br><br>');
    }
  }

  // Form lifecycle callbacks
  formAssociatedCallback(form: HTMLFormElement | null) {
    // Called when the element is associated with or disassociated from a form
    if (form) {
      form.addEventListener('reset', () => {
        this.value = '';
        this.internals.setValidity({});
      });
    }
  }

  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  formResetCallback() {
    this.value = '';
    this.internals.setValidity({});
  }

  formStateRestoreCallback(state: string) {
    if (state) {
      this.value = state;
    }
  }

  // Lifecycle methods
  connectedCallback() {
    super.connectedCallback();

    // Add form validation listener if in a form
    if (this.closest('form')) {
      this.addEventListener('invalid', () => {
        this.updateValidity();
      });
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('_value') || changedProperties.has('required')) {
      this.updateValidity();
    }
  }

  render() {
    return html`
      <div class="form-control">
        <div class="form-control-label">
          <slot name="label"></slot>
        </div>

        <div
          class="editor"
          contenteditable=${!this.disabled}
          @input=${this.handleInput}
          @paste=${this.handlePaste}
          @keydown=${this.handleKeyDown}
        ></div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'formatted-text-input': FormattedTextInput;
  }
}
