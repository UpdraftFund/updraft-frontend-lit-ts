import { css, LitElement } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';

import compass from '@icons/navigation/compass.svg';
import house from '@icons/navigation/house.svg';

import { nav } from '@state/navigation/navigation';
import { customElement, property } from 'lit/decorators.js';

@customElement('left-nav')
export class LeftNav extends SignalWatcher(LitElement) {
  static styles = css`
    a {
      text-decoration: none;
      color: inherit;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      padding: 0.75rem;
      white-space: nowrap;
      justify-content: flex-start;
    }

    a.active {
      color: var(--accent);
      background: var(--subtle-background);
    }

    a:hover {
      text-decoration: underline;
      color: var(--accent);
    }

    :host([collapsed]) nav a {
      justify-content: center;
      padding: 0.75rem 0;
    }

    :host([collapsed]) .location {
      display: none;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 1rem 0;
    }

    sl-icon {
      font-size: 1.5rem;
    }

    @media (max-width: 1024px) and (min-width: 769px) {
      .location {
        display: none;
      }

      a {
        justify-content: center;
      }

      :host([expanded]) nav a {
        justify-content: flex-start;
        padding: 0.75rem;
      }
    }

    @media (max-width: 768px) {
      .location {
        display: block;
      }
    }
  `;

  @property({ type: Boolean, reflect: true }) collapsed = false;
  @property({ type: Boolean, reflect: true }) expanded = false;

  render() {
    return html`
      <nav>
        <ul>
          <li>
            <a href="/" class=${nav.get() === 'home' ? 'active' : ''}>
              <sl-icon src=${house}></sl-icon>
              <span class="location">Home</span>
            </a>
          </li>
          <li>
            <a
              href="/discover"
              class=${nav.get() === 'discover' ? 'active' : ''}
            >
              <sl-icon src=${compass}></sl-icon>
              <span class="location">Discover</span>
            </a>
          </li>
        </ul>
      </nav>
    `;
  }
}
