import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/avatar/avatar.js';

@customElement('user-avatar')
export class UserAvatar extends LitElement {
  static styles = css``;

  @property() address = '';
  @property() imageUrl = '';
  @state() blockieUrl = '';

  updateBlockie() {
    if (!this.imageUrl) {
      if (this.address) {
        import('ethereum-blockies-base64').then(({ default: makeBlockie }) => {
          this.blockieUrl = makeBlockie(this.address);
        });
      } else {
        this.blockieUrl = '';
      }
    }
  }

  render() {
    this.updateBlockie();
    return html`<label class="avatar'">
      <sl-avatar
        image=${this.imageUrl || this.blockieUrl}
        label="avatar"
      ></sl-avatar>
    </label> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'user-avatar': UserAvatar;
  }
}
