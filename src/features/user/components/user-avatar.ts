import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/avatar/avatar.js';

@customElement('user-avatar')
export class UserAvatar extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }

    sl-avatar {
      --size: var(--avatar-size);
    }
  `;

  @property() address = '';
  @property() image = '';
  @state() blockie = '';

  updateBlockie() {
    if (!this.image) {
      if (this.address) {
        import('ethereum-blockies-base64').then(({ default: makeBlockie }) => {
          this.blockie = makeBlockie(this.address);
        });
      } else {
        this.blockie = '';
      }
    }
  }

  render() {
    this.updateBlockie();
    return html`<label class="avatar">
      <sl-avatar image=${this.image || this.blockie} label="avatar"></sl-avatar>
    </label> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'user-avatar': UserAvatar;
  }
}
