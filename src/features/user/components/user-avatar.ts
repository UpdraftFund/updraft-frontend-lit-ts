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
      position: relative;
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

    .avatar [slot='edit-icon'] {
      position: absolute;
      bottom: 0.5rem;
      right: 0.5rem;
      width: 32px;
      height: 32px;
      background: #fff;
      border-radius: 50%;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      border: 1.5px solid #e0e0e0;
      cursor: pointer;
      padding: 0;
      transition: box-shadow 0.15s;
    }
    .avatar [slot='edit-icon']:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
    }
    .avatar [slot='edit-icon'] sl-icon {
      width: 18px;
      height: 18px;
      color: var(--main-foreground, #222);
      display: block;
    }

    input[type='file'] {
      display: none;
    }
  `;

  @property({ type: String }) address = '';
  @property({ type: String }) imageUrl = '';
  @property({ type: Boolean }) editable = false;
  @property({ type: String }) size = '42px';
  @property({ type: String }) blockieUrl: string = '';

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
    if (changedProperties.has('address')) {
      if (this.address) {
        this.generateBlockie(this.address).then((url) => {
          this.blockieUrl = url;
        });
      } else {
        this.blockieUrl = '';
      }
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

    /**
     * Slot: 'edit-icon'
     * If provided, will be rendered as an overlay FAB in the bottom right of the avatar when editable is true and an image or blockie is present.
     * The parent component is responsible for providing the icon and FAB styling/positioning.
     */
    return html`
      <label class="avatar ${this.editable ? 'avatar-editable' : ''}">
        ${this.imageUrl
          ? html`<img src="${this.imageUrl}" alt="User avatar" />`
          : this.address && this.blockieUrl
            ? html`<img src="${this.blockieUrl}" alt="User avatar" />`
            : null}
        ${this.editable && (this.imageUrl || (this.address && this.blockieUrl))
          ? html`<slot name="edit-icon"></slot>`
          : ''}
        ${this.editable
          ? html`
              <input
                type="file"
                accept="image/*"
                @change="${this.handleImageUpload}"
              />
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
