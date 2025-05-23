import { LitElement, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { SignalWatcher, html } from '@lit-labs/signals';

import { rightSidebarContent } from '@state/layout';

@customElement('right-side-bar')
export class RightSideBar extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      border-left: 1px solid var(--border-default);
      padding: 1rem 0;
    }
    .content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    @media (max-width: 1040px) and (min-width: 769px) {
      :host {
        transition:
          opacity 0.3s ease,
          visibility 0.3s ease;
      }
    }

    @media (max-width: 768px) {
      :host {
        border-left: none;
        border-top: 1px solid var(--border-default);
      }
    }
  `;

  render() {
    return html` <div class="content">${rightSidebarContent.get()}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'right-side-bar': RightSideBar;
  }
}
