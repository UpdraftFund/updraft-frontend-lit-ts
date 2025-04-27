// create-idea-button.ts
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import plusLgIcon from '@icons/navigation/plus-lg.svg';

@customElement('create-idea-button')
export class CreateIdeaButton extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
    }
    sl-icon-button {
      color: var(--main-foreground);
      background: var(--main-background);
      border-color: var(--main-foreground);
    }
    sl-icon-button:hover {
      color: var(--main-background);
      background: var(--main-foreground);
    }
  `;

  render() {
    return html`
      <sl-tooltip content="create an idea">
        <sl-icon-button
          src="${plusLgIcon}"
          href="/create-idea"
          label="create an idea"
        ></sl-icon-button>
      </sl-tooltip>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'create-idea-button': CreateIdeaButton;
  }
}
