import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';

import plusLgIcon from '@icons/navigation/plus-lg.svg';

import { nav } from '@state/navigation';

@customElement('create-idea-button')
export class CreateIdeaButton extends LitElement {
  static styles = css`
    .hidden {
      display: none;
    }
    sl-icon-button::part(base) {
      color: var(--main-foreground);
      background: var(--main-background);
      border-color: var(--main-foreground);
      border-radius: 27%;
    }
    sl-icon-button::part(base):hover {
      color: var(--main-background);
      background: var(--main-foreground);
    }
  `;

  render() {
    return html`
      <sl-tooltip
        class="${nav.get() === 'discover' ? 'hidden' : ''}"
        content="create an idea"
      >
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
