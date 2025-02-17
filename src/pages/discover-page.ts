import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

import '@layout/top-bar';
import '@layout/left-side-bar';
import '@components/search-bar';

import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';

@customElement('discover-page')
export class DiscoverPage extends LitElement {

  static styles = css`
    
    .search-tabs {
      display: flex;
      align-items: center;
      flex: 1;
      justify-content: center;
    }

    .container {
      display: flex;
      flex: auto;
      overflow: hidden;
    }

    left-side-bar {
      flex: 0 0 274px;
    }

    main {
      flex: 1;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: .2rem;
      padding: .5rem 1rem;
      color: var(--main-foreground);
      background: var(--main-background);
    }
  `;

  @property() tab: string | null = null;
  @property() search: string | null = null;

  private handleTab(e: any) {
    this.tab = e.detail.name;
  }

  render() {
    return html`
      <top-bar>
        <span class="search-tabs">
          <sl-tab-group @sl-tab-show=${this.handleTab}>
            <sl-tab slot="nav" panel="hot-ideas" .active=${this.tab === 'hot-ideas'}>Hot Ideas</sl-tab>
            <sl-tab slot="nav" panel="new-ideas" .active=${this.tab === 'new-ideas'}>New Ideas</sl-tab>
            <sl-tab slot="nav" panel="deadline" .active=${this.tab === 'deadline'}>Deadline</sl-tab>
            <sl-tab slot="nav" panel="followed" .active=${this.tab === 'followed'}>Followed</sl-tab>
            <sl-tab slot="nav" panel="search" .active=${this.tab === 'search'}>Search</sl-tab>
          </sl-tab-group>
          <search-bar value=${this.search}></search-bar>
        </span>
      </top-bar>
      <div class="container">
        <left-side-bar location="discover"></left-side-bar>
        <main></main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'discover-page': DiscoverPage;
  }
}
