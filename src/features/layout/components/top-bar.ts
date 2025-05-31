import { LitElement, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher, html } from '@lit-labs/signals';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

import listIcon from '@icons/navigation/list.svg';

import updraftLogo from '@images/updraft-logo-46.png';
import '@components/navigation/user-menu';

import { topBarContent, toggleLeftSidebar } from '@state/layout';

@customElement('top-bar')
export class TopBar extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      background: var(--subtle-background);
      color: var(--main-foreground);
      display: flex;
      height: 64px;
      padding: 0 2rem;
      justify-content: space-between;
      align-items: center;
      gap: 2rem;
      overflow: clip;
    }
    a {
      line-height: 0;
    }
    .logo-button img {
      border-radius: 50%;
    }
    .menu-button {
      display: none;
    }
    sl-icon-button {
      color: var(--main-foreground);
      font-size: 1.5rem;
    }
    .content {
      display: flex;
      flex: 1;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      overflow: hidden;
    }
    .content div {
      display: flex;
      flex: 1;
      align-items: center;
    }
    /* allow tabs and search combo div to be centered by providing a max width */
    .tabs-and-search {
      max-width: calc(412px + 450px);
    }
    page-heading a {
      font-size: 1rem;
    }
    @media (max-width: 892px) {
      :host {
        padding: 0 1rem;
        gap: 1rem;
      }
      .content {
        justify-content: flex-start;
        gap: 1rem;
      }
    }
    @media (max-width: 768px) {
      .menu-button {
        display: block;
      }
      .logo-button {
        display: none;
      }
      :host {
        padding: 0 0.5rem;
        gap: 0.5rem;
      }
      .content {
        justify-content: flex-start;
        gap: 0.5rem;
      }
      create-idea-button {
        display: none;
      }
    }
  `;

  render() {
    return html`
      <sl-icon-button
        class="menu-button"
        src="${listIcon}"
        label="Menu"
        @click=${toggleLeftSidebar}
      ></sl-icon-button>
      <a href="/" title="Updraft Home" class="logo-button">
        <img src="${updraftLogo}" alt="Updraft logo" />
      </a>
      <div class="content">${topBarContent.get()}</div>
      <user-menu></user-menu>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'top-bar': TopBar;
  }
}
