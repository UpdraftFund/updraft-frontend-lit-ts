import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { theme } from '../../styles/theme';

export interface TabOption {
  id: string;
  label: string;
}

@customElement('app-tabs')
export class AppTabs extends LitElement {
  @property({ type: Array })
  options: TabOption[] = [];

  @property({ type: String })
  activeTab: string = '';

  @property()
  onChange?: (tabId: string) => void;

  static styles = [
    theme,
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
        color: var(--rever-blue-600);
        font-weight: 600;
        border-bottom: 1px solid var(--rever-blue-600);
      }
    `
  ];

  private handleTabClick(tabId: string) {
    if (this.onChange) {
      this.onChange(tabId);
    }
  }

  render() {
    return html`
      <div class="tabs-container">
        ${this.options.map(tab => html`
          <button
            class="tab ${tab.id === this.activeTab ? 'active' : ''}"
            @click=${() => this.handleTabClick(tab.id)}
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