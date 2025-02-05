import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Task, TaskStatus } from '@lit/task';
import { waitForTransactionReceipt } from '@wagmi/core';
import { TransactionReceipt } from 'viem';

import { config } from '../web3';

export class TransactionSuccess extends Event {
  static readonly type = 'transaction-success';

  constructor(public readonly receipt: TransactionReceipt) {
    super(TransactionSuccess.type, {
      bubbles: true,
      composed: true,
    });
  }
}

export class TransactionError extends Event {
  static readonly type = 'transaction-error';

  constructor(public readonly error: Error) {
    super(TransactionError.type, {
      bubbles: true,
      composed: true,
    });
  }
}

@customElement('transaction-watcher')
export class TransactionWatcher extends LitElement {
  @property({ type: String }) hash?: `0x${string}`;
  @property({ type: Number }) timeout = 60000; // 60 seconds default

  receipt: TransactionReceipt | null = null;

  transactionTask = new Task(
    this,
    async ([hash, timeout]) => {
      // If there's a hash and no pending task, wait for the transaction receipt
      if (hash && !this.pending()) {
        try {
          this.receipt = await waitForTransactionReceipt(config, {
            hash,
            timeout,
          });

          if (this.receipt.status === 'reverted') {
            throw new Error('Transaction reverted');
          }

          this.dispatchEvent(new TransactionSuccess(this.receipt));
          return this.receipt;
        } catch (error) {
          this.dispatchEvent(new TransactionError(error as Error));
          throw error;
        }
      }
    },
    // Arguments passed into the task
    () => [this.hash, this.timeout]
  );


  pending() {
    return this.transactionTask.status === TaskStatus.PENDING;
  }

  render() {
    return html`
      ${this.transactionTask.render({
        pending: () => html`
          <slot name="pending">
            <p>Waiting for transaction...</p>
          </slot>
        `,
        complete: () => html`
          <slot name="complete">
            <p>Transaction succeeded</p>
          </slot>
        `,
        error: (error) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return html`
            <slot name="error">
              <p>Error: ${errorMessage}</p>
            </slot>
          `;
        },
      })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'transaction-watcher': TransactionWatcher;
  }
}