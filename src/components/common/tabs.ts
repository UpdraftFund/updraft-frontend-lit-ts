import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { LitComponent } from '../litComponent';

export interface TabOption {
  id: string;
  label: string;
}

@customElement('app-tabs')
export class AppTabs extends LitComponent {
  @property({ type: Array })
  options: TabOption[] = [];

  @property({ type: String })
  activeTab: string = '';

  static styles = [
    css`
      :host {
        display: block;
      }

      .tabs-container {
        display: flex;
        gap: 24px;
      }

      .tab {
        padding: 0px 0px;
        cursor: pointer;
        border: none;
        background: none;
        font-size: 20px;
        color: var(--mako-500);
        position: relative;
        transition: color 0.2s ease;
        font-weight: 600;
        border-bottom: 1px solid transparent;
      }

      .tab.active {
        color: var(--river-blue-600);
        font-weight: 600;
        border-bottom: 1px solid var(--river-blue-600);
      }
    `
  ];

  private _handleTabClick(tabId: string) {
    this.dispatchEvent(new CustomEvent('change', { detail: { tabId } }));
  }

  render() {
    return html`
      <div class="tabs-container">
        ${this.options.map(tab => html`
          <button
            class="tab ${tab.id === this.activeTab ? 'active' : ''}"
            @click=${() => this._handleTabClick(tab.id)}
            role="tab"
            aria-selected=${tab.id === this.activeTab}
            aria-controls="panel-${tab.id}"
          >
            ${tab.label}
          </button>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-tabs': AppTabs;
  }
} 