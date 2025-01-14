import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import './profile-area';

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
    img {
      border-radius: 50%;
      cursor: pointer;
    }
  `
  render() {
    return html`
      <a href="/">
        <img src="/src/assets/updraft-logo-46.png" alt="Updraft logo" title="Updraft Home"/>
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