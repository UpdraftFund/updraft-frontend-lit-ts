import { LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher, html } from '@lit-labs/signals';

import { rightSidebarContent, leftSidebarCollapsed } from '@state/layout';

@customElement('right-side-bar')
export class RightSideBar extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
      background-color: var(--main-background);
      border-left: 1px solid var(--border-default);
      padding: 1rem;
      overflow-y: auto;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Responsive behavior */
    @media (max-width: 1024px) and (min-width: 769px) {
      :host {
        transition:
          opacity 0.3s ease,
          visibility 0.3s ease;
      }

      :host([hidden-by-left-sidebar]) {
        opacity: 0;
        visibility: hidden;
        width: 0;
        padding: 0;
        margin: 0;
        flex-basis: 0 !important;
        overflow: hidden;
      }
    }

    @media (max-width: 768px) {
      :host {
        border-left: none;
        border-top: 1px solid var(--border-default);
      }
    }
  `;

  @property({
    type: Boolean,
    reflect: true,
    attribute: 'hidden-by-left-sidebar',
  })
  hiddenByLeftSidebar = false;

  render() {
    this.hiddenByLeftSidebar =
      !leftSidebarCollapsed.get() &&
      window.innerWidth <= 1024 &&
      window.innerWidth > 768;
    return html` <div class="content">${rightSidebarContent.get()}</div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'right-side-bar': RightSideBar;
  }
}
