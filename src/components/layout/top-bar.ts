import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import './profile-area';

import updraftLogo from '../../assets/updraft-logo-46.png';

@customElement('top-bar')
export class TopBar extends LitElement {
  static styles = css`
    :host {
      background: var(--subtle-background);
      display: flex;
      height: 64px;
      padding: 0 24px;
      justify-content: space-between;
      align-items: center;
    }
    a {
      line-height: 0;
    }
    img {
      border-radius: 50%;
    }
  `
  render() {
    return html`
      <a href="/" title="Updraft Home">
        <img src="${updraftLogo}" alt="Updraft logo"/>
      </a>
      <slot></slot>
      <profile-area></profile-area>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'top-bar': TopBar;
  }
}