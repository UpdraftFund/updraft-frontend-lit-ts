import { customElement, property } from 'lit/decorators.js';
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
    /* The edit-profile and view-profile pages need a wider right sidebar */
    :host([page='edit-profile']) right-side-bar,
    :host([page='view-profile']) right-side-bar {
      flex: 0 1 34rem;
    }

    @media (min-width: 769px) and (max-width: 1040px) {
      :host([hide-right-sidebar]) .main-extended {
        flex-direction: column;
      }
    }

    @media (max-width: 768px) {
      left-side-bar {
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }
      .main-extended {
        flex-direction: column;
        position: absolute;
        z-index: -1;
      }
    }
  `;

  @property({ reflect: true }) page = nav.get();
  @property({
    type: Boolean,
    reflect: true,
    attribute: 'hide-right-sidebar',
  })
  hideRightSidebar = false;

  render() {
    this.page = nav.get();
    // Move the right sidebar content to the bottom if the left sidebar is shown on medium-width screens
    this.hideRightSidebar = !leftSidebarCollapsed.get();
    return html`
      <top-bar></top-bar>
      <div class="app-layout">
        ${showLeftSidebar.get()
          ? html` <left-side-bar></left-side-bar>`
          : html``}
        <div class="main-extended">
          <main>
            <slot></slot>
          </main>
          ${showRightSidebar.get()
            ? html` <right-side-bar></right-side-bar>`
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
