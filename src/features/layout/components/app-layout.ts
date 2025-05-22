import { customElement } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { SignalWatcher, html } from '@lit-labs/signals';

import '@layout/top-bar';
import '@layout/left-side-bar';
import '@layout/right-side-bar';

import {
  leftSidebarCollapsed,
  showLeftSidebar,
  showRightSidebar,
} from '@state/layout';
import { nav } from '@state/navigation';

@customElement('app-layout')
export class AppLayout extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
    }
    .app-layout {
      display: flex;
      justify-content: space-between;
      position: relative;
    }
    /* Backdrop overlay for mobile sidebar */
    .sidebar-backdrop {
      position: absolute;
      width: 100%;
      height: 1000%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 99; /* Just below the sidebar */
      opacity: 1;
      transition: opacity 0.3s ease-in-out;
      pointer-events: none;
    }
    left-side-bar {
      flex: 0 0 17rem;
      background-color: var(--main-background);
    }
    .main-extended {
      display: flex;
      justify-content: space-between;
      width: 100%;
      overflow: clip;
    }
    main {
      display: flex;
      flex: 1;
    }
    right-side-bar {
      flex: 0 0 19rem;
    }
    right-side-bar.wider {
      flex: 0 1 34rem;
    }

    @media (min-width: 769px) and (max-width: 1040px) {
      .main-extended.right-sidebar-below {
        flex-direction: column;
      }
    }

    @media (max-width: 768px) {
      left-side-bar {
        position: relative;
        z-index: 100;
      }
      .main-extended {
        flex-direction: column;
        position: absolute;
        z-index: -1;
      }
      /* Show backdrop when sidebar is open */
      .sidebar-backdrop {
        display: block;
      }
      .sidebar-backdrop.active {
        opacity: 1;
        pointer-events: auto;
      }
    }
  `;

  private handleBackdropClick = () => {
    leftSidebarCollapsed.set(true);
  };

  render() {
    const leftSidebarVisible =
      showLeftSidebar.get() && !leftSidebarCollapsed.get();

    return html`
      <top-bar></top-bar>
      <div class="app-layout">
        <!-- Backdrop overlay for mobile -->
        <div
          class="sidebar-backdrop ${leftSidebarVisible ? 'active' : ''}"
          @click=${this.handleBackdropClick}
        ></div>

        ${showLeftSidebar.get()
          ? html` <left-side-bar></left-side-bar>`
          : html``}
        <div
          class="main-extended ${leftSidebarVisible
            ? 'right-sidebar-below'
            : ''}"
        >
          <main>
            <slot></slot>
          </main>
          ${showRightSidebar.get()
            ? html` <right-side-bar
                class="${nav.get() === 'edit-profile' ||
                nav.get() === 'view-profile'
                  ? 'wider'
                  : ''}"
              ></right-side-bar>`
            : html``}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-layout': AppLayout;
  }
}
