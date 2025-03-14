import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { consume } from '@lit/context';
import { Task } from '@lit/task';

import compass from '@icons/compass.svg';
import house from '@icons/house.svg';
import chevronLeft from '@icons/chevron-left.svg';
import chevronRight from '@icons/chevron-right.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@components/section-heading';
import '@components/idea-card-small';

import { connectionContext, leftSidebarCollapsed, toggleLeftSidebar } from '@/context.ts';
import { Connection } from '@/types';

import urqlClient from '@/urql-client.ts';
import {
  IdeasByFunderDocument,
  SolutionsByFunderOrDrafterDocument,
} from '@gql';

@customElement('left-side-bar')
export class LeftSideBar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      background: var(--main-background);
      border-radius: 25px 25px 0 0;
      border-right: 3px solid var(--subtle-background);
      overflow: hidden;
      padding: 0 1rem;
      transition: width 0.3s ease, padding 0.3s ease, flex-basis 0.3s ease;
      position: relative;
    }

    :host([collapsed]) {
      width: 64px;
      padding: 0;
      flex-basis: 64px !important;
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
      border: 2px solid var(--subtle-background);
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

    /* Responsive behavior */
    @media (max-width: 768px) {
      :host {
        position: fixed;
        top: 64px; /* Height of top-bar */
        left: 0;
        bottom: 0;
        z-index: 100;
        width: 250px;
        transform: translateX(-100%);
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        box-shadow: none;
        border-radius: 0;
        border-right: none;
        background: var(--main-background);
        overflow-y: auto;
      }

      :host([expanded]) {
        transform: translateX(0);
        box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
      }

      .toggle-button {
        display: none; /* Hide the toggle button on mobile, we'll use the top bar button instead */
      }

      .drawer-backdrop {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 99;
        opacity: 0;
        transition: opacity 0.3s ease;
        pointer-events: none;
      }

      :host([expanded]) + .drawer-backdrop {
        display: block;
        opacity: 1;
        pointer-events: all;
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

  @property({ reflect: true }) location?: string;
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
    document.addEventListener('layout-sidebar-left-toggle', this.handleSidebarToggle);
    document.addEventListener('toggle-drawer', this.handleDrawerToggle);
    
    // Create backdrop element for mobile drawer
    this.createBackdrop();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('storage', this.handleStorageChange);
    document.removeEventListener('layout-sidebar-left-toggle', this.handleSidebarToggle);
    document.removeEventListener('toggle-drawer', this.handleDrawerToggle);
    
    // Remove backdrop when component is disconnected
    this.removeBackdrop();
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

  private handleToggle() {
    toggleLeftSidebar();
    // Dispatch an event that other components can listen to
    const event = new CustomEvent('layout-sidebar-left-toggle', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  private createBackdrop() {
    // Create backdrop element if it doesn't exist
    if (!document.querySelector('.drawer-backdrop')) {
      const backdrop = document.createElement('div');
      backdrop.classList.add('drawer-backdrop');
      backdrop.addEventListener('click', () => {
        this.expanded = false;
        this.requestUpdate();
        document.body.style.overflow = '';
      });
      
      // Insert after this element
      this.parentNode?.insertBefore(backdrop, this.nextSibling);
    }
  }
  
  private removeBackdrop() {
    const backdrop = document.querySelector('.drawer-backdrop');
    if (backdrop) {
      backdrop.remove();
    }
  }

  render() {
    return html`
      <div class="toggle-button" @click=${this.handleToggle}>
        <sl-icon
          src=${this.collapsed ? chevronRight : chevronLeft}
          label="Toggle sidebar"
        ></sl-icon>
      </div>
      <nav>
        <ul>
          <li>
            <a href="/" class=${this.location === 'home' ? 'active' : ''}>
              <sl-icon src=${house}></sl-icon>
              <span class="label">Home</span>
            </a>
          </li>
          <li>
            <a
              href="/discover?tab=hot-ideas"
              class=${this.location === 'discover' ? 'active' : ''}
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
                  .solution=${ic.solution}
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
