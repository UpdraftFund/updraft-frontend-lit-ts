import { customElement, state } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';

// Components
import '@layout/page-heading';

// State
import layout from '@state/layout';

// Utils
import { formatAmount, formatDate } from '@utils/format-utils';

@customElement('faucet-page')
export class FaucetPage extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
        color: var(--main-foreground);
        background: var(--main-background);
      }

      .container {
        max-width: 70rem;
        margin: 1.5rem 3rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .card {
        background: var(--card-background);
        border: 1px solid var(--card-border);
        border-radius: 8px;
        padding: 1.25rem;
      }

      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }

      .title {
        font-size: 1.25rem;
        font-weight: 600;
        margin: 0;
      }

      .muted {
        color: var(--subtle-text);
        font-size: 0.95rem;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .stat {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .stat .label {
        color: var(--subtle-text);
        font-size: 0.85rem;
      }

      .stat .value {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--main-foreground);
      }

      .actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        margin-top: 0.5rem;
      }

      .hint {
        color: var(--subtle-text);
        font-size: 0.9rem;
      }

      @media (max-width: 768px) {
        .container {
          margin: 1rem;
        }
        .grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ];

  // Placeholder data to be wired later
  @state() private faucetBalance: bigint = 0n;
  @state() private lastCollectedAt: number | null = null; // seconds since epoch

  connectedCallback() {
    super.connectedCallback();
    layout.topBarContent.set(html`<page-heading>Faucet</page-heading>`);
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(false);

    // Temporary placeholder values; to be replaced with live data
    // Example: 12,345 UPD faucet balance
    this.faucetBalance = 12345n * 10n ** 18n;
    // Example: user collected 3 days ago; change to null for "never collected"
    this.lastCollectedAt = Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60;
  }

  private get claimAmount(): bigint {
    // 1% of faucet balance
    return this.faucetBalance / 100n;
  }

  private get nextEligibleAt(): number {
    // One week after last collection; if never collected, eligible immediately
    const last = this.lastCollectedAt;
    if (!last) return 0; // eligible now
    return last + 7 * 24 * 60 * 60;
  }

  private get isEligible(): boolean {
    const now = Math.floor(Date.now() / 1000);
    return this.nextEligibleAt <= now;
  }

  render() {
    const eligible = this.isEligible;
    const claimAmount = this.claimAmount;
    const nextAt = this.nextEligibleAt;

    return html`
      <div class="container">
        <div class="card">
          <div class="header">
            <h2 class="title">Weekly Faucet Claim</h2>
            <div class="muted">Collect 1% of the faucet once per week</div>
          </div>

          <div class="grid" style="margin-top: 0.75rem;">
            <div class="stat">
              <div class="label">Faucet balance</div>
              <div class="value">${formatAmount(this.faucetBalance)} UPD</div>
            </div>
            <div class="stat">
              <div class="label">Your weekly amount</div>
              <div class="value">${formatAmount(claimAmount)} UPD</div>
            </div>
          </div>

          <div class="actions">
            ${eligible
              ? html`
                  <sl-button variant="primary" disabled>
                    Collect ${formatAmount(claimAmount)} UPD
                  </sl-button>
                  <span class="hint">Coming soon</span>
                `
              : html`
                  <sl-button variant="default" disabled>
                    Next collection ${formatDate(nextAt, 'fromNow')}
                  </sl-button>
                  <span class="hint">
                    On ${formatDate(nextAt, 'withTime')}
                  </span>
                `}
          </div>
        </div>

        <div class="card">
          <h3 class="title" style="margin-bottom: 0.25rem;">
            About the Faucet
          </h3>
          <p class="muted">
            Faucet funds are sourced from anti-spam fees across the app. Each
            user can claim 1% of the current faucet balance once every 7 days,
            measured from their last collection time. Wallet connection and
            on-chain interactions will be added here soon.
          </p>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'faucet-page': FaucetPage;
  }
}
