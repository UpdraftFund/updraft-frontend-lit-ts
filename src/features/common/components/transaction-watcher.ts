import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { initialState, Task } from '@lit/task';
import { waitForTransactionReceipt } from '@wagmi/core';
import { TransactionReceipt } from 'viem';

import { config } from '@utils/web3';

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

/**
 * Interface for transaction watcher components
 * Used to track and display transaction status
 */
export interface ITransactionWatcher extends HTMLElement {
  /**
   * The transaction hash being watched
   */
  hash?: `0x${string}`;

  /**
   * Reset the transaction watcher state
   */
  reset(): void;

  /**
   * Add an event listener to the transaction watcher
   * @param type Event type to listen for (e.g., 'transaction-success')
   * @param listener The callback function
   * @param options Optional event listener options
   */
  addEventListener(
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void;
}

@customElement('transaction-watcher')
export class TransactionWatcher
  extends LitElement
  implements ITransactionWatcher
{
  @property({ type: String }) hash?: `0x${string}`;
  @property({ type: Number }) timeout = 60000; // 60 seconds default

  receipt: TransactionReceipt | null = null;

  transactionTask = new Task(
    this,
    async ([hash, timeout]) => {
      // If there's no valid transaction hash, return `initialState`
      if (!hash) {
        return initialState;
      }

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
    },
    // Arguments passed into the task
    () => [this.hash, this.timeout]
  );

  /**
   * Reset the task to its `INITIAL` state and clear the hash.
   */
  reset() {
    this.hash = undefined;
    this.transactionTask.run([this.hash, this.timeout]); // Reset task to INITIAL
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
          const errorMessage =
            error instanceof Error ? error.message : String(error);
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
