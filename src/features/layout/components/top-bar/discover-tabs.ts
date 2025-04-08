import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';

type QueryType =
  | 'hot-ideas'
  | 'new-ideas'
  | 'deadline'
  | 'followed'
  | 'search'
  | 'tags';

@customElement('discover-tabs')
export class DiscoverTabs extends LitElement {
  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }

    sl-tab-group::part(base) {
      width: 100%;
    }

    sl-tab-group::part(nav) {
      justify-content: center;
    }
  `;

  @property({ type: String }) tab?: QueryType;
  @property({ type: String }) search?: string;

  private handleTab(e: CustomEvent) {
    const tabName = e?.detail?.name as QueryType;
    if (tabName) {
      // Create a custom event to notify parent components
      const event = new CustomEvent('tab-changed', {
        detail: { tab: tabName },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);

      // Update URL and navigate to discover page if needed
      const currentPath = window.location.pathname;
      const isDiscoverPage = currentPath === '/discover';
      const url = new URL(isDiscoverPage ? window.location.href : `${window.location.origin}/discover`);
      
      // Set the tab parameter
      url.searchParams.set('tab', tabName);
      
      // Preserve search parameter if it exists
      if (this.search) {
        url.searchParams.set('search', this.search);
      } else {
        url.searchParams.delete('search');
      }
      
      // Navigate to the new URL
      if (isDiscoverPage) {
        // If already on discover page, just update the URL
        if (window.location.href !== url.toString()) {
          window.history.pushState({}, '', url.toString());
        }
      } else {
        // If not on discover page, navigate to discover page
        window.location.href = url.toString();
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
    // Listen for navigation events
    this._onPopState = this._onPopState.bind(this);
    window.addEventListener('popstate', this._onPopState);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('popstate', this._onPopState);
  }

  private _onPopState() {
    // Force re-render when navigation occurs
    this.requestUpdate();
  }

  render() {
    // Don't set any tab as active if this.tab is undefined
    return html`
      <sl-tab-group @sl-tab-show=${this.handleTab}>
        <sl-tab
          slot="nav"
          panel="hot-ideas"
          .active=${this.tab !== undefined && this.tab === 'hot-ideas'}
          >Hot Ideas</sl-tab
        >
        <sl-tab
          slot="nav"
          panel="new-ideas"
          .active=${this.tab !== undefined && this.tab === 'new-ideas'}
          >New Ideas</sl-tab
        >
        <sl-tab slot="nav" panel="deadline" .active=${this.tab !== undefined && this.tab === 'deadline'}
          >Deadline</sl-tab
        >
        <sl-tab slot="nav" panel="followed" .active=${this.tab !== undefined && this.tab === 'followed'}
          >Followed</sl-tab
        >
        ${this.search
          ? html`
              <sl-tab
                slot="nav"
                panel="search"
                .active=${this.tab !== undefined && this.tab === 'search'}
                >Search</sl-tab
              >
            `
          : ''}
      </sl-tab-group>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'discover-tabs': DiscoverTabs;
  }
}
