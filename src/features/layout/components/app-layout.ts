import { customElement, property } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { SignalWatcher, html } from '@lit-labs/signals';

import '@layout/top-bar';
import '@layout/left-side-bar';
import '@layout/right-side-bar';

import { showLeftSidebar, showRightSidebar } from '@state/layout';
import { nav } from '@state/navigation';

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
      overflow-y: auto;
      padding: 0 0.3rem;
    }

    right-side-bar {
      flex: 0 0 300px;
      height: 100%;
    }

    /* The edit-profile and view-profile pages need a wider right sidebar */
    :host([page='edit-profile']) right-side-bar,
    :host([page='view-profile']) right-side-bar {
      flex: 0 1 600px;
    }

    /* Responsive layout */
    @media (max-width: 1024px) {
      .main-content {
        padding: 0 0.3rem;
      }

      /* Ensure right sidebar is visible in tablet view by default */
      right-side-bar {
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

  @property({ reflect: true }) page = nav.get();

  render() {
    this.page = nav.get();
    return html`
      <top-bar></top-bar>
      <div class="app-layout">
        ${showLeftSidebar.get()
          ? html` <left-side-bar></left-side-bar>`
          : html``}
        <main class="main-content">
          <slot></slot>
        </main>
        ${showRightSidebar.get()
          ? html` <right-side-bar></right-side-bar>`
          : html``}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-layout': AppLayout;
  }
}
