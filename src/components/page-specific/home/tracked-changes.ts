import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

@customElement('tracked-changes')
export class TrackedChanges extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    sl-card {
      --padding: 1rem;
    }

    .change-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .change-card-title {
      font-family: var(--sl-font-sans);
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .change-card-byline {
      font-size: 0.875rem;
      color: var(--sl-color-neutral-600);
    }

    .change-card-supporters {
      font-size: 1rem;
      color: var(--sl-color-neutral-700);
    }

    .change-details {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
  `;

  render() {
    return html`
      <h2>Tracked Changes</h2>
      <sl-card>
        <div class="change-card-header">
          <div>
            <h3 class="change-card-title">Audit the Updraft smart contracts</h3>
            <div class="change-card-byline">by johnnycake.eth</div>
          </div>
          <sl-icon-button name="x-lg" label="Remove"></sl-icon-button>
        </div>
        <div class="change-card-supporters">
          Supported by adamstallard.eth, bastin.eth, and 4 others
        </div>
      </sl-card>

      <sl-card>
        <div class="change-card-header">
          <div>
            <h3 class="change-card-title">Updraft Smart Contract Audit</h3>
            <div class="change-card-byline">by Acme Auditors</div>
          </div>
          <sl-icon-button name="x-lg" label="Remove"></sl-icon-button>
        </div>
        <div>Has a new Solution</div>
        <p>
          Our industry-leading audit methodology and tooling includes a review
          of your code's logic, with a mathematical approach to ensure your
          program works as intended.
        </p>
        <sl-button variant="primary">Fund this Solution</sl-button>
        <div class="change-details">
          <span>⏰ in 2 days</span>
          <span>🎯 Goal: 0% of 12.2k USDGLO</span>
          <span>💎 200K</span>
          <span>💰 10%</span>
        </div>
      </sl-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tracked-changes': TrackedChanges;
  }
}
