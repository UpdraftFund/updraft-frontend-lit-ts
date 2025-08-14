import { customElement, state } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';

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
  @state() private maxStreamAmount: bigint = 0n; // Maximum amount that can be streamed over 7 days

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

    // Calculate max stream amount based on contract logic
    this.maxStreamAmount = this.calculateMaxStreamAmount(this.faucetBalance);
  }

  private calculateMaxStreamAmount(balance: bigint): bigint {
    // Calculate the maximum amount that can be streamed over 7 days
    // 1% of balance or 2 UPD tokens, whichever is greater
    let maxStreamAmount = balance / 100n; // 1%

    // Use the greater of 1% or 2 UPD tokens (2 * 10^18 wei)
    const minAmount = 2n * 10n ** 18n; // 2 UPD tokens
    if (maxStreamAmount < minAmount) {
      maxStreamAmount = minAmount;
    }

    // But don't exceed the available balance
    if (maxStreamAmount > balance) {
      maxStreamAmount = balance;
    }

    return maxStreamAmount;
  }

  private get claimAmount(): bigint {
    // Calculate available stream balance based on time passed
    const now = BigInt(Math.floor(Date.now() / 1000));
    const lastClaim = this.lastCollectedAt ? BigInt(this.lastCollectedAt) : 0n;

    // If last claim was more than 7 days ago, the user can withdraw the full amount again
    const STREAM_PERIOD = 7n * 24n * 60n * 60n; // 7 days in seconds
    if (now >= lastClaim + STREAM_PERIOD) {
      return this.maxStreamAmount;
    }

    // Calculate how much should be available based on time passed
    const timePassed = now - lastClaim;
    const streamableAmount =
      (this.maxStreamAmount * timePassed) / STREAM_PERIOD;

    return streamableAmount;
  }

  private get nextEligibleAt(): number {
    // One week after last collection; if never collected, eligible immediately
    const last = this.lastCollectedAt;
    if (!last) return 0; // eligible now
    return last + 7 * 24 * 60 * 60;
  }

  private get isEligible(): boolean {
    // User is eligible if there's a positive claim amount available
    return this.claimAmount > 0n;
  }

  private get claimPercentage(): number {
    // Calculate what percentage of the max stream amount is currently available
    if (this.maxStreamAmount === 0n) return 0;
    return Number((this.claimAmount * 100n) / this.maxStreamAmount);
  }

  render() {
    const eligible = this.isEligible;
    const claimAmount = this.claimAmount;
    const maxAmount = this.maxStreamAmount;
    const claimPercentage = this.claimPercentage;
    const nextAt = this.nextEligibleAt;
    const lastCollectedAt = this.lastCollectedAt;

    return html`
      <div class="container">
        <div class="card">
          <div class="header">
            <h2 class="title">Streaming Faucet Claim</h2>
            <div class="muted">Collect UPD tokens that stream over time</div>
          </div>

          <div class="grid" style="margin-top: 0.75rem;">
            <div class="stat">
              <div class="label">Faucet balance</div>
              <div class="value">${formatAmount(this.faucetBalance)} UPD</div>
            </div>
            <div class="stat">
              <div class="label">Available to claim</div>
              <div class="value">${formatAmount(claimAmount)} UPD</div>
            </div>
          </div>

          ${lastCollectedAt
            ? html`
                <div class="stat" style="margin-top: 0.75rem;">
                  <div class="label">Streaming progress</div>
                  <div class="value">
                    ${claimPercentage.toFixed(1)}% of maximum
                    ${formatAmount(maxAmount)} UPD
                  </div>
                  <sl-progress-bar
                    value="${claimPercentage}"
                    style="margin-top: 0.25rem;"
                  ></sl-progress-bar>
                </div>
              `
            : html`
                <div class="stat" style="margin-top: 0.75rem;">
                  <div class="label">Initial claim</div>
                  <div class="value">Ready to claim maximum amount</div>
                </div>
              `}

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
            Faucet funds are sourced from anti-spam fees across the app. Tokens
            stream continuously over 7 days, allowing you to claim a portion of
            your weekly allocation at any time. The more time that passes since
            your last claim, the more you can collect, up to a maximum of 1% of
            the faucet balance (or 2 UPD tokens, whichever is greater). BrightID
            and/or Human Passport verifications are required to claim from the
            faucet, and will be added here soon.
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
