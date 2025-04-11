/***
 * This is the right-hand sidebar for the Home and Discover screens.
 * https://www.figma.com/design/lfPeBM41v53XQZLkYRUt5h/Updraft?node-id=920-7089&m=dev
 ***/

import { LitElement, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher, html } from '@lit-labs/signals';

import '@components/idea/hot-ideas';
import '@components/idea/related-ideas';
import '@components/idea/top-supporters';
import '@components/tags/watched-tags';
import '@components/tags/popular-tags';

import { rightSidebarContent } from '@state/layout';

@customElement('right-side-bar')
export class RightSideBar extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
      background-color: var(--main-background);
      border-left: 1px solid var(--border-default);
      padding: 1rem;
      overflow-y: auto;
    }

    slot {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Responsive behavior */
    @media (max-width: 1024px) and (min-width: 769px) {
      :host {
        transition:
          opacity 0.3s ease,
          visibility 0.3s ease;
      }

      :host([hidden-by-left-sidebar]) {
        opacity: 0;
        visibility: hidden;
        width: 0;
        padding: 0;
        margin: 0;
        flex-basis: 0 !important;
        overflow: hidden;
      }
    }

    @media (max-width: 768px) {
      :host {
        border-left: none;
        border-top: 1px solid var(--border-default);
      }
    }
  `;

  @property({
    type: Boolean,
    reflect: true,
    attribute: 'hidden-by-left-sidebar',
  })
  hiddenByLeftSidebar = false;

  @property() ideaId?: string;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener(
      'expanded',
      this.handleLeftSidebarExpanded as EventListener
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(
      'expanded',
      this.handleLeftSidebarExpanded as EventListener
    );
  }

  private handleLeftSidebarExpanded = (e: Event) => {
    // Only respond to this event in tablet view
    if (window.innerWidth <= 1024 && window.innerWidth > 768) {
      // The event detail is now just the boolean value
      this.hiddenByLeftSidebar = (e as CustomEvent<boolean>).detail;
    }
  };

  render() {
    return html`
      <slot>${rightSidebarContent.get()}</slot>
      ${this.ideaId
        ? html`
            <top-supporters .ideaId=${this.ideaId}></top-supporters>
            <related-ideas .ideaId=${this.ideaId}></related-ideas>
          `
        : html``}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'right-side-bar': RightSideBar;
  }
}
