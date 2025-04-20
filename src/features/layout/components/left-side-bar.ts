import { customElement, property } from 'lit/decorators.js';
import { LitElement, css } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { isConnected } from '@state/user';

import chevronLeft from '@icons/navigation/chevron-left.svg';
import chevronRight from '@icons/navigation/chevron-right.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@components/navigation/left-nav';
import '@components/user/my-ideas';
import '@components/user/my-solutions';

import { leftSidebarCollapsed, toggleLeftSidebar } from '@state/common';

@customElement('left-side-bar')
export class LeftSideBar extends SignalWatcher(LitElement) {
  @property({ type: Boolean, reflect: true }) collapsed = false;
  @property({ type: Boolean, reflect: true }) expanded = false;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      background: var(--main-background);
      border-radius: 0;
      border-right: 1px solid var(--subtle-background);
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
      box-sizing: border-box;
    }

    .toggle-button {
      position: absolute;
      top: 1rem;
      right: -12px;
      z-index: 10;
      background: var(--main-background);
      border: 1px solid var(--subtle-background);
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: transform 0.3s ease;
    }

    .toggle-button:hover {
      transform: scale(1.1);
    }

    :host([collapsed]) .toggle-button {
      right: -12px;
    }

    :host([collapsed]) my-ideas,
    :host([collapsed]) my-solutions {
      display: none;
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

      .toggle-button {
        display: none; /* Hide the toggle button on mobile, we'll use the top bar button instead */
      }
    }

    @media (max-width: 480px) {
      :host {
        width: 85%; /* Use percentage for better mobile experience */
      }
    }
  `;

  constructor() {
    super();
    this.collapsed = leftSidebarCollapsed.get();
  }

  connectedCallback() {
    super.connectedCallback();
    // Set up a listener for the sidebar state changes
    window.addEventListener('storage', this.handleStorageChange);
    document.addEventListener(
      'layout-sidebar-left-toggle',
      this.handleSidebarToggle
    );
    document.addEventListener('toggle-drawer', this.handleDrawerToggle);
    window.addEventListener('popstate', this.handleNavigation);

    // Add click event listeners to all links for mobile drawer
    this.addEventListener('click', this.handleLinkClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('storage', this.handleStorageChange);
    document.removeEventListener(
      'layout-sidebar-left-toggle',
      this.handleSidebarToggle
    );
    document.removeEventListener('toggle-drawer', this.handleDrawerToggle);
    window.removeEventListener('popstate', this.handleNavigation);
    this.removeEventListener('click', this.handleLinkClick);
  }

  private handleStorageChange = (event: StorageEvent) => {
    if (event.key === 'leftSidebarCollapsed') {
      const newValue = event.newValue === 'true';
      if (this.collapsed !== newValue) {
        this.collapsed = newValue;
      }
    }
  };

  private handleSidebarToggle = () => {
    this.collapsed = leftSidebarCollapsed.get();
    this.requestUpdate();
  };

  private handleDrawerToggle = () => {
    if (window.innerWidth <= 768) {
      this.expanded = !this.expanded;
      this.requestUpdate();

      // Prevent body scrolling when drawer is open
      document.body.style.overflow = this.expanded ? 'hidden' : '';
    }
  };

  private handleNavigation = () => {
    // Close drawer when navigation occurs
    if (this.expanded && window.innerWidth <= 768) {
      this.expanded = false;
      this.requestUpdate();
      document.body.style.overflow = '';
    }
  };

  private handleLinkClick = (event: Event) => {
    // Close drawer when a link is clicked (on mobile only)
    if (this.expanded && window.innerWidth <= 768) {
      const path = event.composedPath();
      for (const element of path) {
        if (element instanceof HTMLAnchorElement) {
          this.expanded = false;
          this.requestUpdate();
          document.body.style.overflow = '';
          break;
        }
      }
    }
  };

  private handleToggle() {
    // For tablet view, toggle expanded state
    if (window.innerWidth <= 1024 && window.innerWidth > 768) {
      this.expanded = !this.expanded;
      this.requestUpdate();

      // Dispatch an event to notify right sidebar about the state change
      const event = new CustomEvent('expanded', {
        bubbles: true,
        composed: true,
        detail: this.expanded,
      });
      this.dispatchEvent(event);

      // Also dispatch the legacy event for backward compatibility
      const layoutEvent = new CustomEvent('layout-sidebar-left-toggle', {
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(layoutEvent);
    } else if (window.innerWidth > 1024) {
      // For desktop view, use the normal collapse toggle
      toggleLeftSidebar();

      // Dispatch an event that other components can listen to
      const layoutEvent = new CustomEvent('layout-sidebar-left-toggle', {
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(layoutEvent);
    }
  }

  render() {
    return html`
      <div class="toggle-button" @click=${this.handleToggle}>
        <sl-icon
          src=${(window.innerWidth <= 1024 &&
            window.innerWidth > 768 &&
            !this.expanded) ||
          (window.innerWidth > 1024 && this.collapsed)
            ? chevronRight
            : chevronLeft}
          label="Toggle sidebar"
        ></sl-icon>
      </div>
      <left-nav
        .collapsed=${this.collapsed}
        .expanded=${this.expanded}
      ></left-nav>
      ${isConnected.get()
        ? html`
            <my-ideas></my-ideas>
            <my-solutions></my-solutions>
          `
        : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'left-side-bar': LeftSideBar;
  }
}
