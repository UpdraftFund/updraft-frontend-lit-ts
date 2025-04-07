import { LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher, html } from '@lit-labs/signals';

import '@layout/profile-area';

import updraftLogo from '@assets/images/updraft-logo-46.png';
import listIcon from '@icons/list.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

import { topBarContent } from '@state/layout-state';

@customElement('top-bar')
export class TopBar extends SignalWatcher(LitElement) {
  @property({
    type: Boolean,
    attribute: 'hide-create-idea-button',
    reflect: true,
  })
  hideCreateIdeaButton = false;

  static styles = css`
    :host {
      background: var(--subtle-background);
      color: var(--main-foreground);
      display: flex;
      height: 64px;
      padding: 0 24px;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      overflow: clip;
    }
    a {
      line-height: 0;
    }
    img {
      border-radius: 50%;
    }
    slot {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .menu-button {
      display: none;
    }
    @media (max-width: 768px) {
      .menu-button {
        display: block;
        margin-right: 8px;
      }
    }
    sl-icon-button {
      color: var(--main-foreground);
      font-size: 1.5rem;
    }
  `;

  private toggleLeftSidebar() {
    const event = new CustomEvent('toggle-drawer', {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    return html`
      <sl-icon-button
        class="menu-button"
        src="${listIcon}"
        label="Menu"
        @click=${this.toggleLeftSidebar}
      ></sl-icon-button>
      <a href="/" title="Updraft Home">
        <img src="${updraftLogo}" alt="Updraft logo" />
      </a>
      <slot>${topBarContent}</slot>
      <profile-area
        .hideCreateIdeaButton=${this.hideCreateIdeaButton}
      ></profile-area>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'top-bar': TopBar;
  }
}
