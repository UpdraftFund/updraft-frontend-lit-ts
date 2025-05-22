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
      min-height: 100vh;
    }
    .app-layout {
      display: flex;
      flex: 1;
      justify-content: flex-start;
      position: relative;
    }

    left-side-bar {
      max-width: 17rem;
      background-color: var(--main-background);
    }
    .main-extended {
      display: flex;
      flex: 1;
      justify-content: space-between;
      width: 100%;
    }
    main {
      display: flex;
      flex-direction: column;
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
        position: absolute;
        z-index: 100;
      }
      .main-extended {
        flex-direction: column;
        z-index: 1;
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
