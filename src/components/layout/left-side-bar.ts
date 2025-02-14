import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

import '@components/section-heading';

@customElement('left-side-bar')
export class LeftSideBar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      border-right: 3px solid var(--layout-divider);
      overflow: hidden;
    }

    section-heading {
      color: var(--section-heading);
      padding: 0 1rem;
    }
  `;

  render() {
    return html`
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/discover">Discover</a></li>
        </ul>
      </nav>
      <section-heading>My Ideas</section-heading>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'left-side-bar': LeftSideBar;
  }
}