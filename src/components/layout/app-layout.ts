import {LitElement, html, css} from 'lit';
import {customElement} from 'lit/decorators.js';

@customElement('app-layout')
export class AppLayout extends LitElement {
  static styles = css`
    header {
      background: var(--subtle-background);
      display: flex;
      height: 64px;
      width: 100vw;
      padding: 0px 24px;
      justify-content: space-between;
      align-items: center;
    }

    img {
      border-radius: 50%;
    }
  `
  render() {
    return html`
      <header>
        <img src="/src/assets/updraft-logo-46.png" alt="Updraft logo" />
      </header>
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-layout': AppLayout;
  }
}