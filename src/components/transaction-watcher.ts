import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Task, TaskStatus } from '@lit/task';
import { waitForTransactionReceipt } from '@wagmi/core';
import { TransactionReceipt } from 'viem';

import { config } from '../web3';

@customElement('transaction-watcher')
export class TransactionWatcher extends LitElement {
  @property({ type: `0x{string}` }) hash?: `0x{string}`;
  @property({ type: Number }) timeout = 60000; // 60 seconds default

  receipt: TransactionReceipt | null = null;

  transactionTask = new Task(
    this,
    async ([hash, timeout]) => {
      if (hash && !this.pending()) {
        this.receipt = await waitForTransactionReceipt(config, {
          hash,
          timeout,
        });
        if (this.receipt.status == 'reverted') throw new Error('transaction reverted');
      }
    },
    () => [this.hash, this.timeout] // React to changes in these dependencies
  );

  pending() {
    return this.transactionTask.status === TaskStatus.PENDING;
  }

  /** Render the component, handling each task state */
  render() {
    return html`
        ${this.transactionTask.render({
          pending: () => html`<p>Waiting for transaction...</p>`,
          complete: () => html`<p>Transaction succeeded</p>`,
          error: (error) => html`<p>Error: ${error}</p>`,
        })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'transaction-watcher': TransactionWatcher;
  }
}