import { LitElement, css, html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { isAddress } from 'viem';

// Components
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';
import type { SlInput } from '@shoelace-style/shoelace';
import '@components/common/transaction-watcher';
import type { TransactionWatcher } from '@components/common/transaction-watcher';

// Contracts
import { IdeaContract } from '@contracts/idea';

// Styles
import { changeCardStyles } from '@styles/change-card-styles';

@customElement('split-transfer')
export class SplitTransfer extends LitElement {
  static styles = [
    changeCardStyles,
    css`
      :host {
        display: block;
        max-width: 600px;
        margin: 2rem auto;
        padding: 0 1rem;
      }

      .form-container {
        margin-bottom: 2rem;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: var(--main-foreground);
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        margin-top: 2rem;
      }

      .operation-title {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--main-foreground);
      }

      h2.operation-title {
        font-size: 1.25rem;
        margin-top: 0;
      }

      .description {
        color: var(--subtle-text);
        margin-bottom: 2rem;
        line-height: 1.5;
      }

      sl-input::part(base) {
        border-radius: var(--sl-input-border-radius-medium);
      }
    `,
  ];

  @property() entityId!: `0x${string}`;
  @property() position!: string;

  @query('form.split-form', true) splitForm!: HTMLFormElement;
  @query('form.transfer-form', true) transferForm!: HTMLFormElement;
  @query('sl-input[name="numSplits"]', true) numSplitsInput!: SlInput;
  @query('sl-input[name="recipient"]', true) recipientInput!: SlInput;
  @query('transaction-watcher.split', true)
  splitTransaction!: TransactionWatcher;
  @query('transaction-watcher.transfer', true)
  transferTransaction!: TransactionWatcher;

  private handleSplitSubmit = (event: Event) => {
    event.preventDefault();
    this.handleSplit();
  };

  private handleTransferSubmit = (event: Event) => {
    event.preventDefault();
    this.handleTransfer();
  };

  private async handleSplit() {
    if (!this.splitForm.checkValidity()) {
      this.splitForm.reportValidity();
      return;
    }

    const numSplits = parseInt(this.numSplitsInput.value);
    if (numSplits < 2) {
      this.numSplitsInput.setCustomValidity(
        'Number of splits must be at least 2'
      );
      this.numSplitsInput.reportValidity();
      return;
    }

    this.splitTransaction.reset();
    try {
      const contract = new IdeaContract(this.entityId);
      this.splitTransaction.hash = await contract.write('split', [
        BigInt(parseInt(this.position)),
        BigInt(numSplits),
      ]);
    } catch (error) {
      console.error('Split transaction failed:', error);
      // The transaction watcher will handle the error display
    }
  }

  private async handleTransfer() {
    if (!this.transferForm.checkValidity()) {
      this.transferForm.reportValidity();
      return;
    }

    const recipient = this.recipientInput.value.trim();
    if (!isAddress(recipient)) {
      this.recipientInput.setCustomValidity(
        'Please enter a valid Ethereum address'
      );
      this.recipientInput.reportValidity();
      return;
    }

    this.transferTransaction.reset();
    try {
      const contract = new IdeaContract(this.entityId);
      this.transferTransaction.hash = await contract.write('transferPosition', [
        recipient as `0x${string}`,
        BigInt(parseInt(this.position)),
      ]);
    } catch (error) {
      console.error('Transfer transaction failed:', error);
      // The transaction watcher will handle the error display
    }
  }

  private handleTransactionSuccess = () => {
    // Navigate back or show success message
    window.history.back();
  };

  private handleInputChange = (event: Event) => {
    const input = event.target as SlInput;
    // Clear custom validity when user starts typing
    input.setCustomValidity('');
  };

  render() {
    return html`
      <sl-card>
        <div slot="header">
          <h1 class="operation-title">Split & Transfer Position</h1>
        </div>

        <div class="description">
          Manage your position by splitting it into multiple smaller positions
          or transferring it to another address.
        </div>

        <!-- Position Info -->
        <div class="form-container">
          <div class="form-group">
            <label>Entity ID:</label>
            <sl-input
              value=${this.entityId}
              readonly
              help-text="The contract address of the idea or solution"
            ></sl-input>
          </div>

          <div class="form-group">
            <label>Position Index:</label>
            <sl-input
              value=${this.position}
              readonly
              help-text="The index of the position you want to split or transfer"
            ></sl-input>
          </div>
        </div>

        <sl-divider></sl-divider>

        <!-- Split Form -->
        <div class="form-container">
          <h2 class="operation-title">Split Position</h2>
          <p class="description">
            Split your position into multiple smaller positions. This allows you
            to manage your stake more flexibly or transfer parts of it to
            different addresses.
          </p>

          <form class="split-form" @submit=${this.handleSplitSubmit}>
            <div class="form-group">
              <label for="numSplits">Number of Splits:</label>
              <sl-input
                name="numSplits"
                type="number"
                min="2"
                max="100"
                required
                placeholder="Enter number of splits (minimum 2)"
                help-text="Your position will be divided into this many equal parts"
                @sl-input=${this.handleInputChange}
              ></sl-input>
            </div>

            <div class="form-actions">
              <sl-button variant="primary" type="submit">
                Split Position
              </sl-button>
            </div>
          </form>
        </div>

        <sl-divider></sl-divider>

        <!-- Transfer Form -->
        <div class="form-container">
          <h2 class="operation-title">Transfer Position</h2>
          <p class="description">
            Transfer your position to another Ethereum address. The recipient
            will receive full ownership of this position.
          </p>

          <form class="transfer-form" @submit=${this.handleTransferSubmit}>
            <div class="form-group">
              <label for="recipient">Recipient Address:</label>
              <sl-input
                name="recipient"
                type="text"
                required
                placeholder="0x..."
                help-text="The Ethereum address that will receive the position"
                @sl-input=${this.handleInputChange}
              ></sl-input>
            </div>

            <div class="form-actions">
              <sl-button variant="primary" type="submit">
                Transfer Position
              </sl-button>
            </div>
          </form>
        </div>

        <!-- Transaction Watchers -->
        <transaction-watcher
          class="split"
          @transaction-success=${this.handleTransactionSuccess}
        >
          <div slot="pending">
            <p>
              Splitting position... Please wait for the transaction to complete.
            </p>
          </div>
          <div slot="complete">
            <p>
              Position split successfully! Your position has been divided into
              multiple parts.
            </p>
          </div>
          <div slot="error">
            <p>Failed to split position. Please try again.</p>
          </div>
        </transaction-watcher>

        <transaction-watcher
          class="transfer"
          @transaction-success=${this.handleTransactionSuccess}
        >
          <div slot="pending">
            <p>
              Transferring position... Please wait for the transaction to
              complete.
            </p>
          </div>
          <div slot="complete">
            <p>
              Position transferred successfully! The recipient now owns this
              position.
            </p>
          </div>
          <div slot="error">
            <p>Failed to transfer position. Please try again.</p>
          </div>
        </transaction-watcher>

        <!-- Back Button -->
        <div
          class="form-actions"
          style="margin-top: 2rem; justify-content: center;"
        >
          <sl-button variant="default" @click=${() => window.history.back()}>
            ← Back
          </sl-button>
        </div>
      </sl-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'split-transfer': SplitTransfer;
  }
}
