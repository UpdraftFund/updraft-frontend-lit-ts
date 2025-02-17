import { customElement } from 'lit/decorators.js';
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

  render() {
    return html`
      <top-bar>
        <span class="search-tabs">
          <sl-tab-group>
            <sl-tab slot="nav">Hot Ideas</sl-tab>
            <sl-tab slot="nav">New Ideas</sl-tab>
            <sl-tab slot="nav">Deadline</sl-tab>
            <sl-tab slot="nav">Followed</sl-tab>
            <sl-tab slot="nav">Search</sl-tab>
          </sl-tab-group>
          <search-bar></search-bar>
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
