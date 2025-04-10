import { customElement, property } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { consume } from '@lit/context';
import { Task } from '@lit/task';

import compass from '@icons/navigation/compass.svg';
import house from '@icons/navigation/house.svg';
import chevronLeft from '@icons/navigation/chevron-left.svg';
import chevronRight from '@icons/navigation/chevron-right.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@/features/common/components/section-heading';
import '@/features/idea/components/idea-card-small';

import {
  connectionContext,
  leftSidebarCollapsed,
  toggleLeftSidebar,
} from '@/features/common/state/context';
import { Connection } from '@/features/user/types/current-user';
import { Solution } from '@/features/solution/types';
import { nav } from '@state/navigation/navigation.ts';

import urqlClient from '@/features/common/utils/urql-client';
import {
  IdeasByFunderDocument,
  SolutionsByFunderOrDrafterDocument,
} from '@gql';

@customElement('left-side-bar')
export class LeftSideBar extends SignalWatcher(LitElement) {
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

    nav ul {
      list-style: none;
      padding: 0;
      margin: 1rem 0;
    }

    nav a {
      text-decoration: none;
      color: inherit;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      padding: 0.75rem;
      white-space: nowrap;
    }

    nav a.active {
      color: var(--accent);
      background: var(--subtle-background);
    }

    nav a:hover {
      text-decoration: underline;
      color: var(--accent);
    }

    sl-icon {
      font-size: 24px;
    }

    section-heading {
      color: var(--section-heading);
      padding: 0 1rem;
    }

    .my-ideas {
      padding: 1rem 1.4rem 0;
      box-sizing: border-box;
    }

    idea-card-small {
      width: 100%;
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

    :host([collapsed]) .label,
    :host([collapsed]) section-heading,
    :host([collapsed]) .my-ideas,
    :host([collapsed]) .my-solutions {
      display: none;
    }

    :host([collapsed]) nav a {
      justify-content: center;
      padding: 0.75rem 0;
    }

    /* Tablet breakpoint - auto-collapse sidebar but allow manual expansion */
    @media (max-width: 1024px) and (min-width: 769px) {
      :host {
        width: 64px;
        padding: 0;
        flex-basis: 64px !important;
      }

      :host .label,
      :host section-heading,
      :host .my-ideas,
      :host .my-solutions {
        display: none;
      }

      :host nav a {
        justify-content: center;
        padding: 0.75rem 0;
      }

      /* When expanded, show full sidebar */
      :host([expanded]) {
        width: 250px;
        padding: 0 1rem;
        flex-basis: 250px !important;
      }

      :host([expanded]) .label,
      :host([expanded]) section-heading,
      :host([expanded]) .my-ideas,
      :host([expanded]) .my-solutions {
        display: block;
      }

      :host([expanded]) nav a {
        justify-content: flex-start;
        padding: 0.75rem;
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
      :host .label,
      :host section-heading,
      :host .my-ideas,
      :host .my-solutions {
        display: block;
      }

      :host nav a {
        justify-content: flex-start;
        padding: 0.75rem;
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

  private readonly ideaContributions = new Task(this, {
    task: async ([funder]) => {
      if (funder) {
        const result = await urqlClient.query(IdeasByFunderDocument, {
          funder,
        });
        return result.data?.ideaContributions;
      }
    },
    args: () => [this.connection.address] as const,
  });

  private readonly solutionContributions = new Task(this, {
    task: async ([funder]) => {
      if (funder) {
        const result = await urqlClient.query(
          SolutionsByFunderOrDrafterDocument,
          { user: funder }
        );
        return result.data?.solutionContributions;
      }
    },
    args: () => [this.connection.address] as const,
  });

  @consume({ context: connectionContext, subscribe: true })
  connection!: Connection;

  @property({ type: Boolean, reflect: true }) collapsed = false;
  @property({ type: Boolean, reflect: true }) expanded = false;

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
      <nav>
        <ul>
          <li>
            <a href="/" class=${nav.get() === 'home' ? 'active' : ''}>
              <sl-icon src=${house}></sl-icon>
              <span class="label">Home</span>
            </a>
          </li>
          <li>
            <a
              href="/discover?tab=hot-ideas"
              class=${nav.get() === 'discover' ? 'active' : ''}
            >
              <sl-icon src=${compass}></sl-icon>
              <span class="label">Discover</span>
            </a>
          </li>
        </ul>
      </nav>
      <section-heading>My Ideas</section-heading>
      <div class="my-ideas">
        ${this.ideaContributions.render({
          complete: (ics) =>
            ics?.map(
              (ic) => html`
                <idea-card-small .idea=${ic.idea}></idea-card-small>
              `
            ),
        })}
      </div>
      <section-heading>My Solutions</section-heading>
      <div class="my-solutions">
        ${this.solutionContributions.render({
          complete: (ics) =>
            ics?.map(
              (ic) => html`
                <solution-card-small
                  .solution=${ic.solution as Solution}
                ></solution-card-small>
              `
            ),
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'left-side-bar': LeftSideBar;
  }
}
