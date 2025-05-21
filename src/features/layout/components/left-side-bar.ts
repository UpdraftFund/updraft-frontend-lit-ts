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
      padding: 0 1rem;
      transition:
        width 0.3s ease,
        padding 0.3s ease,
        flex-basis 0.3s ease;
      position: relative;
      box-sizing: border-box;
    }

    :host([collapsed]) {
      width: 64px;
      padding: 0;
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

    left-nav {
      position: relative;
    }

    /* Tablet breakpoint - auto-collapse sidebar but allow manual expansion */
    @media (max-width: 1024px) and (min-width: 769px) {
      :host {
        width: 64px;
        padding: 0;
        flex-basis: 64px !important;
      }

      :host my-ideas,
      :host my-solutions {
        display: none;
      }

      /* When expanded, show full sidebar */
      :host([expanded]) {
        width: 250px;
        padding: 0 1rem;
        flex-basis: 250px !important;
      }

      :host([expanded]) my-ideas,
      :host([expanded]) my-solutions {
        display: block;
      }
    }

    /* Mobile breakpoint - switch to drawer mode */
    @media (max-width: 768px) {
      :host {
        position: fixed;
        top: 64px; /* Height of top-bar */
        left: 0;
        bottom: 0;
        z-index: 100;
        width: 250px;
        transform: translateX(-100%);
        transition:
          transform 0.3s ease,
          box-shadow 0.3s ease;
        box-shadow: none;
        border-radius: 0;
        border-right: none;
        background: var(--main-background);
        overflow-y: auto;
        padding: 0 1rem;
      }

      :host([expanded]) {
        transform: translateX(0);
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
      }

      /* Show all content in drawer mode */
      :host my-ideas,
      :host my-solutions {
        display: block;
      }

      :host([collapsed]) .collapsed-toggle {
        display: none; /* Hide in mobile collapsed mode as we use the top bar button */
      }
    }

    @media (max-width: 480px) {
      :host {
        width: 85%; /* Use percentage for better mobile experience */
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
