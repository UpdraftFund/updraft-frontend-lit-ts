import { customElement } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { SignalWatcher, html } from '@lit-labs/signals';

import '@layout/top-bar';
import '@layout/left-side-bar';
import '@layout/right-side-bar';
import '@components/common/full-overlay';

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
      flex: 1;
      justify-content: flex-start;
      position: relative;
    }

    left-side-bar {
      background-color: var(--main-background);
    }
    .main-extended {
      display: flex;
      flex: 1;
      justify-content: space-between;
    }
    main {
      display: flex;
      flex: 1 1 47rem;
      flex-direction: column;
    }
    right-side-bar {
      flex: 0 0 18rem;
      color: var(--main-foreground);
      background-color: var(--main-background);
    }
    right-side-bar.wider {
      flex: 0 1 34rem;
    }

    @media (min-width: 769px) and (max-width: 1024px) {
      .main-extended.right-sidebar-below {
        flex-direction: column;
        justify-content: normal;
      }
      .right-sidebar-below main {
        flex: 1 1 100%;
      }
      .right-sidebar-below right-side-bar {
        flex: 0 0 100%;
        border: 0;
        padding-left: 1rem;
      }
    }

    @media (max-width: 768px) {
      left-side-bar {
        position: absolute;
        z-index: 100;
      }
      .main-extended {
        flex-direction: column;
        justify-content: normal;
        z-index: 1;
      }
      main {
        flex: 1 1 100%;
      }
      right-side-bar {
        flex: 0 0 100%;
        border: 0;
        padding-left: 0.5rem;
        padding-right: 0.5rem;
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
        <!-- Backdrop overlay for mobile only - positioned within app-layout (below top bar) -->
        <full-overlay
          ?active=${leftSidebarVisible}
          ?mobileOnly=${true}
          position="absolute"
          z-index="99"
          opacity="0.7"
          @overlay-click=${this.handleBackdropClick}
        ></full-overlay>

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
