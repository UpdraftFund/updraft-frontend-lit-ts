import { customElement, property } from 'lit/decorators.js';
import { LitElement, css } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';

import chevronLeft from '@icons/navigation/chevron-left.svg';
import chevronRight from '@icons/navigation/chevron-right.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@components/navigation/left-nav';
import '@components/user/my-ideas';
import '@components/user/my-solutions';

import { leftSidebarCollapsed, toggleLeftSidebar } from '@state/layout';
import { userAddress } from '@state/user';

@customElement('left-side-bar')
export class LeftSideBar extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border-default);
      overflow: hidden;
      position: relative;
      padding: 0 1rem;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }

    :host([collapsed]) {
      flex-basis: 64px !important;
    }

    /* Toggle container for collapsed state */
    .collapsed-toggle {
      display: none;
      justify-content: center;
      padding: 1rem 0 0;
    }

    :host([collapsed]) .collapsed-toggle {
      display: flex;
    }

    /* For the inline toggle when expanded */
    .inline-toggle {
      display: none;
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      z-index: 2;
    }

    :host(:not([collapsed])) .inline-toggle {
      display: block;
    }

    sl-icon-button {
      font-size: 1rem;
      border: 1px solid var(--main-foreground);
      border-radius: 50%;
      background: var(--subtle-background);
      color: var(--main-foreground);
    }

    sl-icon-button::part(base) {
      padding: 0.25rem;
    }

    sl-icon-button:hover {
      transform: scale(1.2);
    }

    :host([collapsed]) my-ideas,
    :host([collapsed]) my-solutions {
      display: none;
    }

    /* Mobile breakpoint - switch to drawer mode */
    @media (max-width: 768px) {
      :host {
        border-right: none;
      }
      :host([collapsed]) {
        display: none;
      }
    }
  `;

  @property({ type: Boolean, reflect: true }) collapsed = false;
  @property({ type: Boolean, reflect: true }) expanded = false;

  private handleToggle = () => {
    toggleLeftSidebar();
    // Prevent scrolling of main content when sidebar is open on mobile
    if (window.innerWidth <= 768) {
      document.body.style.overflow = leftSidebarCollapsed.get() ? '' : 'hidden';
    }
  };

  private handleNavigation = () => {
    // Close drawer when navigation occurs (on mobile only)
    if (window.innerWidth <= 768 && !leftSidebarCollapsed.get()) {
      this.handleToggle();
    }
  };

  private handleLinkClick = (event: Event) => {
    // Close drawer when a link is clicked (on mobile only)
    if (window.innerWidth <= 768 && !leftSidebarCollapsed.get()) {
      const path = event.composedPath();
      for (const element of path) {
        if (element instanceof HTMLAnchorElement) {
          this.handleToggle();
          break;
        }
      }
    }
  };

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('popstate', this.handleNavigation);
    // Add click event listeners to all links for mobile drawer
    this.addEventListener('click', this.handleLinkClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('popstate', this.handleNavigation);
    this.removeEventListener('click', this.handleLinkClick);
  }

  render() {
    this.collapsed = leftSidebarCollapsed.get();
    this.expanded = !this.collapsed;
    const address = userAddress.get();
    return html`
      <!-- Toggle button that shows when collapsed (centered at top) -->
      <div class="collapsed-toggle">
        <sl-icon-button
          src=${chevronRight}
          label="Expand sidebar"
          @click=${this.handleToggle}
        ></sl-icon-button>
      </div>

      <!-- Toggle button that shows inline with first nav item when expanded -->
      <div class="inline-toggle">
        <sl-icon-button
          src=${chevronLeft}
          label="Collapse sidebar"
          @click=${this.handleToggle}
        ></sl-icon-button>
      </div>

      <left-nav></left-nav>
      <my-ideas .address=${address}></my-ideas>
      <my-solutions .address=${address}></my-solutions>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'left-side-bar': LeftSideBar;
  }
}
