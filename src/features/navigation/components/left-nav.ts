import { css, LitElement } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { html, SignalWatcher } from '@lit-labs/signals';

import compass from '@icons/navigation/compass.svg';
import house from '@icons/navigation/house.svg';
import discord from '@icons/discord.svg';
import guide from '@icons/navigation/guide-link.svg';
import kite from '@icons/navigation/kite.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

import '@components/common/upd-dialog';
import { UpdDialog } from '@components/common/upd-dialog';

import { nav } from '@state/navigation';
import { leftSidebarCollapsed } from '@state/layout';

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

    nav.collapsed a {
      justify-content: center;
      padding: 0.3rem 0;
      margin: 0.7rem 0;
    }

    nav.collapsed .location {
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
      a {
        justify-content: center;
      }

      nav.expanded a {
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

  @query('upd-dialog', true) updDialog!: UpdDialog;

  private handleGetUpdClick = async (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    await this.updDialog.show();
  };

  render() {
    return html`
      <nav class=${leftSidebarCollapsed.get() ? 'collapsed' : 'expanded'}>
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
          <li>
            <a href="https://guide.updraft.fund/" target="_blank" }>
              <sl-icon src=${guide}></sl-icon>
              <span class="location">Guide</span>
            </a>
          </li>
          <li>
            <a href="https://discord.gg/mQJ58MY6Nz" target="_blank">
              <sl-icon src=${discord}></sl-icon>
              <span class="location">Chat</span>
            </a>
          </li>
          <li>
            <a href="#" @click=${this.handleGetUpdClick}>
              <sl-icon src=${kite}></sl-icon>
              <span class="location">Get UPD</span>
            </a>
          </li>
        </ul>
      </nav>
      <upd-dialog></upd-dialog>
    `;
  }
}
