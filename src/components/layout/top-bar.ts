import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@layout/profile-area';
import '@/components/shared/user-profile';
import '@/components/shared/search-bar';
import '@/components/page-specific/discover/discover-tabs';

import updraftLogo from '@assets/images/updraft-logo-46.png';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

import listIcon from '@icons/list.svg';

@customElement('top-bar')
export class TopBar extends LitElement {
  @property({
    type: Boolean,
    attribute: 'hide-create-idea-button',
    reflect: true,
  })
  hideCreateIdeaButton = false;

  @property({ type: String })
  tab?: string;

  @property({ type: String })
  search?: string;

  @property({ type: Boolean, attribute: 'show-search', reflect: true })
  showSearch = true;
  
  @property({ type: Boolean, attribute: 'show-discover-tabs', reflect: true })
  showDiscoverTabs = false;

  static styles = css`
    :host {
      background: var(--subtle-background);
      color: var(--main-foreground);
      display: flex;
      height: 64px;
      padding: 0 24px;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      overflow: clip;
    }
    a {
      line-height: 0;
    }
    img {
      border-radius: 50%;
    }
    .middle-section {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .search-container {
      flex: 1;
      max-width: 450px;
      margin: 0 auto;
    }
    .menu-button {
      display: none;
    }
    @media (max-width: 768px) {
      .menu-button {
        display: block;
        margin-right: 8px;
      }
    }
    sl-icon-button {
      color: var(--main-foreground);
      font-size: 1.5rem;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.updatePageState();
    
    // Listen for URL changes
    this._onPopState = this._onPopState.bind(this);
    window.addEventListener('popstate', this._onPopState);
    
    // Listen for tab changes from discover-tabs
    this.addEventListener('tab-changed', this.handleTabChanged as EventListener);
    
    // Setup URL change listener for navigation that doesn't trigger popstate
    this._handleUrlChange = this._handleUrlChange.bind(this);
    this._setupUrlChangeListener();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('popstate', this._onPopState);
    this.removeEventListener('tab-changed', this.handleTabChanged as EventListener);
    this._teardownUrlChangeListener();
  }
  
  private _lastUrl = window.location.href;
  private _urlChangeInterval?: number;
  
  private _setupUrlChangeListener() {
    // Check for URL changes every 100ms
    this._urlChangeInterval = window.setInterval(this._handleUrlChange, 100);
  }
  
  private _teardownUrlChangeListener() {
    if (this._urlChangeInterval) {
      clearInterval(this._urlChangeInterval);
    }
  }
  
  private _handleUrlChange() {
    const currentUrl = window.location.href;
    if (this._lastUrl !== currentUrl) {
      this._lastUrl = currentUrl;
      this.updatePageState();
    }
  }

  private _onPopState() {
    this.updatePageState();
  }

  private updatePageState() {
    // Get URL parameters regardless of page
    const urlParams = new URLSearchParams(window.location.search);
    
    // Only set a default tab if we're on the discover page
    const isDiscoverPage = window.location.pathname === '/discover';
    
    // If not on discover page, explicitly set tab to undefined
    if (!isDiscoverPage) {
      this.tab = undefined;
    } else {
      this.tab = urlParams.get('tab') || 'hot-ideas';
    }
    
    this.search = urlParams.get('search') || undefined;
  }

  private handleTabChanged(e: CustomEvent) {
    this.tab = e.detail.tab;
  }

  private toggleLeftSidebar() {
    const event = new CustomEvent('toggle-drawer', {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  render() {
    return html`
      <sl-icon-button
        class="menu-button"
        src="${listIcon}"
        label="Menu"
        @click=${this.toggleLeftSidebar}
      ></sl-icon-button>
      <a href="/" title="Updraft Home">
        <img src="${updraftLogo}" alt="Updraft logo" />
      </a>
      <div class="middle-section">
        ${this.showDiscoverTabs
          ? html`<discover-tabs .tab=${this.tab} .search=${this.search}></discover-tabs>`
          : ''}
        ${this.showSearch
          ? html`
              <div class="search-container">
                <search-bar></search-bar>
              </div>
            `
          : ''}
      </div>
      <profile-area
        .hideCreateIdeaButton=${this.hideCreateIdeaButton}
      ></profile-area>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'top-bar': TopBar;
  }
}
