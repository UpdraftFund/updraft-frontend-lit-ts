import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

import compass from '@icons/compass.svg';
import house from '@icons/house.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@components/section-heading';
import '@components/idea-card-small';

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

    nav a {
      text-decoration: none;
      color: inherit;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      padding: .75rem;
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
    
    .my-ideas {
      padding-top: 1rem;
      align-self: center;
    }
    
    idea-card-small {
      width: 240px;
    }
    
  `;

  @property({reflect: true}) location: string | null = null;

  render() {
    return html`
      <nav>
        <ul>
          <li><a href="/" class=${this.location === 'home' ? 'active' : ''}>
            <sl-icon src=${house}></sl-icon>
            Home
          </a></li>
          <li><a href="/discover" class=${this.location === 'discover' ? 'active' : ''}>
            <sl-icon src=${compass}></sl-icon>
            Discover
          </a></li>
        </ul>
      </nav>
      <section-heading>My Ideas</section-heading>
      <div class="my-ideas">
        <idea-card-small
            .startTime=${1646099200}
            .funderReward=${50.2432}
            .name= ${'My Idea'}
            .description= ${'My idea description'}
            .id=${'0x1234567890123456789012345678901234567890'}
            .shares=${7845325}
        ></idea-card-small>
      </div>
      <section-heading>My Solutions</section-heading>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'left-side-bar': LeftSideBar;
  }
}