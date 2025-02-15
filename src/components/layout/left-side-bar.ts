import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

import compass from '@icons/compass.svg';
import house from '@icons/house.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
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
    
    nav ul {
      list-style: none;
    }
    
    nav ul li {
      margin-bottom: 1rem;
    }

    nav a {
      text-decoration: none;
      color: inherit;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
    }

    nav a.active {
      color: var(--accent);
      background: var(--subtle-background);
    }

    nav a:hover {
      text-decoration: underline;
      color: var(--accent);
    }
    
    sl-icon {
      font-size: 24px;
    }

    section-heading {
      color: var(--section-heading);
      padding: 0 1rem;
    }
  `;

  @property({reflect: true}) location: string | null = null;

  render() {
    return html`
      <nav>
        <ul>
          <li><a href="/" class=${this.location === 'home' ? 'active' : ''}>
            <sl-icon src=${house}></sl-icon>Home
          </a></li>
          <li><a href="/discover" class=${this.location === 'discover' ? 'active' : ''}>
            <sl-icon src=${compass}></sl-icon>Discover
          </a></li>
        </ul>
      </nav>
      <section-heading>My Ideas</section-heading>
      <section-heading>My Solutions</section-heading>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'left-side-bar': LeftSideBar;
  }
}