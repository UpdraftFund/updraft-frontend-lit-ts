import { LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher, html } from '@lit-labs/signals';

@customElement('user-avatar')
export class UserAvatar extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: inline-block;
    }

    .avatar {
      border-radius: 50%;
      width: 100%;
      height: 100%;
      aspect-ratio: 1/1;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar-editable {
      position: relative;
      cursor: pointer;
      background: var(--main-background);
      padding: 0.2rem;
    }

    .avatar-editable:hover {
      background: var(--control-background);
    }

    .avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .edit-icon {
      color: var(--main-foreground);
      background: inherit;
      position: absolute;
      bottom: 0;
      right: 0;
      border-radius: 50%;
      padding: 0.2rem;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }

    input[type='file'] {
      display: none;
    }
  `;

  @property({ type: String }) address = '';
  @property({ type: String }) imageUrl = '';
  @property({ type: Boolean }) editable = false;
  @property({ type: String }) size = '42px';

  async generateBlockie(address: string) {
    try {
      const { default: makeBlockie } = await import('ethereum-blockies-base64');
      return makeBlockie(address);
    } catch (error) {
      console.error('Error generating blockie:', error);
      return '';
    }
  }

  private async handleImageUpload(event: Event) {
    if (!this.editable) return;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Dispatch an event with the new image data
        this.dispatchEvent(
          new CustomEvent('avatar-change', {
            detail: { imageUrl: result },
            bubbles: true,
            composed: true,
          })
        );
      };
      reader.readAsDataURL(file);
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('size')) {
      this.style.width = this.size;
      this.style.height = this.size;
    }
  }

  firstUpdated() {
    // Set initial width/height
    this.style.width = this.size;
    this.style.height = this.size;
  }

  render() {
    console.log('user-avatar rendering with:', {
      address: this.address,
      imageUrl: this.imageUrl,
      editable: this.editable,
      size: this.size,
    });

    return html`
      <label class="avatar ${this.editable ? 'avatar-editable' : ''}">
        ${this.imageUrl
          ? html`<img src="${this.imageUrl}" alt="User avatar" />`
          : this.address
            ? html`<img
                src="${this.generateBlockie(this.address)}"
                alt="User avatar"
              />`
            : html`<img
                src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxZW0iIGhlaWdodD0iMWVtIiB2aWV3Qm94PSIwIDAgMTYgMTYiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTgsMWE3LDcsMCwxLDAsNyw3QTcsNywwLDAsMCw4LDFabTAsMTNhNiw2LDAsMSwxLDYtNkE2LDYsMCwwLDEsOCwxNFptMC03QTIuNSwyLjUsMCwxLDAsNi41LDloMEEyLjUsMi41LDAsMCwwLDgsN1ptMCwxLjVBMSwxLDAsMSwxLDcsOWgwQTEsMSwwLDAsMSw4LDguNVptMy41LDMuNWEzLDMsMCwwLDEtNywwYzAtMS4xLDEuMS0yLDIuNS0yaDJjMS40LDAsMi41LjksMi41LDJaIi8+PC9zdmc+"
                alt="User avatar"
              />`}
        ${this.editable
          ? html`
              <input
                type="file"
                accept="image/*"
                @change="${this.handleImageUpload}"
              />
              <slot name="edit-icon">
                <svg
                  class="edit-icon"
                  width="16"
                  height="16"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"
                  />
                </svg>
              </slot>
            `
          : ''}
      </label>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'user-avatar': UserAvatar;
  }
}
