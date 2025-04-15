import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';

import { DiscoverQueryType } from '@/types';

@customElement('discover-tabs')
export class DiscoverTabs extends LitElement {
  static styles = css`
    :host {
      display: flex;
      justify-content: center;
      flex: 1;
    }
  `;

  @property({ type: String }) tab?: DiscoverQueryType;

  private handleTab(e: CustomEvent) {
    const tabName = e?.detail?.name as DiscoverQueryType;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabName);
    window.history.pushState({}, '', url.toString());
  }

  render() {
    // Don't set any tab as active if this.tab is undefined
    return html`
      <sl-tab-group @sl-tab-show=${this.handleTab}>
        <sl-tab slot="nav" panel="hot-ideas" .active=${this.tab === 'hot-ideas'}
          >Hot Ideas
        </sl-tab>
        <sl-tab slot="nav" panel="new-ideas" .active=${this.tab === 'new-ideas'}
          >New Ideas
        </sl-tab>
        <sl-tab slot="nav" panel="deadline" .active=${this.tab === 'deadline'}
          >Deadline
        </sl-tab>
        <sl-tab slot="nav" panel="followed" .active=${this.tab === 'followed'}
          >Followed
        </sl-tab>
      </sl-tab-group>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'discover-tabs': DiscoverTabs;
  }
}
