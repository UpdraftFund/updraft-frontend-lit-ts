// create-idea-button.ts
import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import plusLgIcon from '@icons/plus-lg.svg';

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
      <sl-icon-button src="${plusLgIcon}" href="/create-idea"></sl-icon-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'create-idea-button': CreateIdeaButton;
  }
}
