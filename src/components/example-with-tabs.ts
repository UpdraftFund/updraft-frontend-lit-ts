import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import type { TabOption } from './common/tabs';
import { LitComponent } from './litComponent';

@customElement('example-with-tabs')
export class ExampleWithTabs extends LitComponent {
  @state()
  private activeTab: string = 'tab1';

  private tabs: TabOption[] = [
    { id: 'tab1', label: 'Profile' },
    { id: 'tab2', label: 'Settings' },
    { id: 'tab3', label: 'Notifications' }
  ];

  static styles = [
    css`
      :host {
        display: block;
      }

      .tab-content {
        padding: 1rem 0;
      }
    `
  ];

  private handleTabChange(tabId: string) {
    this.activeTab = tabId;
  }

  render() {
    return html`
      <app-tabs
        .options=${this.tabs}
        .activeTab=${this.activeTab}
        .onChange=${(tabId: string) => this.handleTabChange(tabId)}
      ></app-tabs>

      <div class="tab-content">
        ${this.activeTab === 'tab1' ? html`
          <div id="panel-tab1" role="tabpanel">Profile Content</div>
        ` : null}
        
        ${this.activeTab === 'tab2' ? html`
          <div id="panel-tab2" role="tabpanel">Settings Content</div>
        ` : null}
        
        ${this.activeTab === 'tab3' ? html`
          <div id="panel-tab3" role="tabpanel">Notifications Content</div>
        ` : null}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'example-with-tabs': ExampleWithTabs;
  }
} 