import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';

/**
 * Formatted text input component that preserves pasted formatting
 * Uses contenteditable div to allow rich text paste while integrating with forms
 */
@customElement('formatted-text-input')
export class FormattedTextInput extends SignalWatcher(LitElement) {
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

  private _value = '';

  @property()
  get value() {
    return this._value;
  }

  set value(newValue: string) {
    const oldValue = this._value;
    this._value = newValue;

    // Update the contenteditable div when value changes
    if (this.editor && this.editor.innerHTML !== newValue) {
      this.editor.innerHTML = newValue;
      // Auto-resize after setting content
      setTimeout(() => this.autoResize(), 0);
    }

    // Update the hidden input
    if (this.hiddenInput && this.hiddenInput.value !== newValue) {
      this.hiddenInput.value = newValue;
    }

    this.requestUpdate('value', oldValue);
  }

  @query('.editor') editor!: HTMLDivElement;
  @query('.hidden-input') hiddenInput!: HTMLInputElement;

  connectedCallback() {
    super.connectedCallback();
    // Set initial content if value is provided
    this.updateComplete.then(() => {
      if (this.value && this.editor) {
        this.editor.innerHTML = this.value;
      }
      // Set up form restoration compatibility
      this.setupFormCompatibility();
      // Initial auto-resize
      setTimeout(() => this.autoResize(), 0);
    });
  }

  private setupFormCompatibility() {
    if (!this.hiddenInput) return;

    // The key insight: SaveableForm only restores if !element.value
    // So we need to make sure our hidden input reports empty initially
    // and then handle the restoration properly

    let isRestorationMode = true;

    // Override the hidden input's value property to sync with our component
    Object.defineProperty(this.hiddenInput, 'value', {
      get: () => {
        // During restoration, report empty so SaveableForm will set the value
        if (isRestorationMode) {
          return '';
        }
        return this._value;
      },
      set: (newValue: string) => {
        // When the form restoration sets the value, update our component
        if (newValue !== this._value) {
          this.value = newValue;
          // After first restoration, exit restoration mode
          isRestorationMode = false;
        }
      },
      configurable: true,
      enumerable: true,
    });

    // Exit restoration mode after a short delay (fallback)
    setTimeout(() => {
      isRestorationMode = false;
    }, 1000);
  }

  private handleInput() {
    const content = this.editor.innerHTML;
    this.value = content;

    // Update hidden input for form submission
    if (this.hiddenInput) {
      this.hiddenInput.value = content;
    }

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
    if (!this.editor) return;

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

        <!-- Hidden input for form submission -->
        <input
          type="hidden"
          name=${this.name}
          class="hidden-input"
          .value=${this.value}
          ?required=${this.required}
        />
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'formatted-text-input': FormattedTextInput;
  }
}
