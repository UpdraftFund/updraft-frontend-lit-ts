import { customElement, state } from "lit/decorators.js";
import { LitComponent } from "../components/litComponent";
import { css, html } from "lit";

@customElement('app-home-page')
export class HomePage extends LitComponent {

  static styles = css`
    :host {
      display: block;
      align-self: stretch;
      overflow: auto;
    }

    .home-page {
      width: clamp(300px, calc(100vw - 64px), 1280px);
      margin: 0 auto;
      padding-top: 64px;
    }

    .your-activities {
      display: flex;
      flex-direction: column;
      gap: 24px;
      margin-bottom: 64px;
    }

    .your-activities-tabs {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

  `;

  tabs = [
    { id: 'overall', label: 'Overall' },
    { id: 'ideas', label: 'Ideas' },
    { id: 'solutions', label: 'Solutions' },
  ];

  @state()
  activeTab = 'overall';

  render() {
    return html`
      <div class="home-page">

        <div class="your-activities">
          <app-section-header title="Your Activities" icon="wave-pulse"></app-section-header>
          <div class="your-activities-tabs">
            <app-tabs .options=${this.tabs} .activeTab=${this.activeTab} @change=${this.onTabChange}></app-tabs>
            <div class="your-activities-content">
              ${this.activeTab === 'overall'
        ? html`<app-overall-section />`
        : this.activeTab === 'ideas'
          ? html`<div>Ideas</div>`
          : this.activeTab === 'solutions'
            ? html`<div>Solutions</div>`
            : ''}
            </div>
          </div>
        </div>
      
      </div>
    `;
  }

  onTabChange(event: CustomEvent) {
    this.activeTab = event.detail.tabId;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-home-page': HomePage;
  }
}
