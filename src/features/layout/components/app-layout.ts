import { customElement } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { SignalWatcher, html } from '@lit-labs/signals';

import '@layout/top-bar';
import '@layout/left-side-bar';
import '@layout/right-side-bar';

import { showLeftSidebar, showRightSidebar } from '@state/layout';

@customElement('app-layout')
export class AppLayout extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      max-width: 100vw;
      color: var(--main-foreground);
      background-color: var(--main-background);
    }

    .app-layout {
      display: flex;
      flex: 1;
      height: calc(100vh - 64px); /* Subtract top-bar height */
      overflow: hidden;
    }

    left-side-bar {
      flex: 0 0 250px;
      overflow-y: auto;
      height: 100%;
      transition: flex-basis 0.3s ease;
    }

    .main-content {
      flex: 1;
      display: flex;
      overflow: hidden;
      padding: 0 0.3rem;
    }

    right-side-bar {
      flex: 0 0 300px;
      overflow: hidden;
      height: 100%;
    }

    /* Responsive layout */
    @media (max-width: 1024px) {
      .main-content {
        padding: 0 0.3rem;
      }

      /* Ensure right sidebar is visible in tablet view by default */
      right-side-bar {
        flex: 0 0 300px;
        display: block;
      }
    }

    @media (max-width: 768px) {
      .app-layout {
        flex-direction: column;
        height: auto;
        min-height: calc(100vh - 64px);
      }

      .main-content {
        flex-direction: column;
        padding: 1rem;
        order: 1; /* Main content first */
      }

      right-side-bar {
        display: block; /* Ensure it's displayed on mobile */
        width: 100%;
        flex: none;
        order: 2; /* Right sidebar below main content */
      }
    }

    @media (max-width: 480px) {
      .main-content {
        padding: 0.5rem;
      }
    }

    .drawer-backdrop {
      display: none;
    }

    .icon-button {
      color: var(--main-foreground);
    }
  `;

  render() {
    return html`
      <top-bar></top-bar>
      <div class="app-layout">
        ${showLeftSidebar ? html` <left-side-bar></left-side-bar>` : html``}
        <main class="main-content">
          <slot></slot>
        </main>
        ${showRightSidebar ? html` <right-side-bar></right-side-bar>` : html``}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-layout': AppLayout;
  }
}
