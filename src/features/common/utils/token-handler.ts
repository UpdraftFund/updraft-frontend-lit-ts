import { LitElement } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { SlInput, SlDialog } from '@shoelace-style/shoelace';
import { parseUnits } from 'viem';

import { TransactionWatcher } from '@components/common/transaction-watcher';
import { updraftSettings } from '@state/common';
import { getBalance, refreshBalances } from '@state/user/balances';
import { Upd } from '@contracts/upd';
import { modal } from '@utils/web3';

/**
 * A mixin that provides token transaction capabilities to Lit components.
 * Currently supports UPD tokens but designed to be extended for other tokens.
 *
 * Components using this mixin should include:
 * - transaction-watcher.approve element
 * - sl-dialog for approval
 *
 * For UPD token handling, components should also include:
 * - upd-dialog element (and provide an onLowBalance callback to show it)
 * - An input field with one of these names: 'deposit', 'stake', 'support', or 'fundingToken'
 *
 * The mixin automatically attaches event handlers to the input field during the
 * firstUpdated lifecycle method, so you don't need to wire them up manually.
 *
 * @example
 * ```ts
 * class MyComponent extends TokenHandler(LitElement) {
 *   @query('upd-dialog') updDialog!: UpdDialog;
 *
 *   render() {
 *     return html`
 *       <sl-input name="deposit"></sl-input>
 *       <div class="error">${this.updError}</div>
 *       <upd-dialog></upd-dialog>
 *       <sl-dialog label="Set Allowance">
 *         <transaction-watcher class="approve"></transaction-watcher>
 *       </sl-dialog>
 *     `;
 *   }
 *
 *   // Example of handling a transaction with proper error handling
 *   private async handleTransaction() {
 *     try {
 *       // Contract interaction code
 *     } catch (err) {
 *       this.handleUpdTransactionError(
 *         err,
 *         contractAddress,
 *         () => this.retryTransaction(), // Optional approval success callback
 *         () => this.updDialog.show()    // Optional low balance callback
 *       );
 *     }
 *   }
 * }
 * ```
 */
// For mixins, TypeScript requires using any[] for constructor arguments
// We need to disable ESLint for this specific case
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
type Constructor<T = {}> = new (...args: any[]) => T;

export const TokenHandler = <T extends Constructor<LitElement>>(
  superClass: T
) => {
  class TokenHandlerElement extends superClass {
    @query('transaction-watcher.approve')
    approveTransaction!: TransactionWatcher;
    @query('sl-dialog') approveDialog!: SlDialog;
    @query(
      'sl-input[name="deposit"], sl-input[name="stake"], sl-input[name="support"], sl-input[name="fundingToken"]'
    )
    protected updInput?: SlInput;

    @state() protected updValue: string = '';
    @state() protected updError: string | null = null;

    /**
     * Whether to include anti-spam fee in validation
     */
    @property({ type: Boolean }) includeAntiSpamFee: boolean = true;

    /**
     * The calculated anti-spam fee for the current UPD value
     */
    protected get antiSpamFee(): number {
      const value = Number(this.updValue || 0);
      if (isNaN(value)) {
        return updraftSettings.get().minFee;
      }
      return Math.max(
        updraftSettings.get().minFee,
        value * updraftSettings.get().percentFee
      );
    }

    /**
     * Whether the user needs more UPD for the current transaction
     */
    protected get needUpd(): boolean {
      const value = Number(this.updValue || 0);
      const userBalance = getBalance('updraft');
      const fee = this.includeAntiSpamFee ? this.antiSpamFee : 0;

      return (
        isNaN(value) ||
        value === 0 ||
        value > userBalance ||
        (this.includeAntiSpamFee && value < fee)
      );
    }

    /**
     * Attach event handlers to the UPD input field
     * This is called during the firstUpdated lifecycle method
     */
    protected setupUpdInput() {
      if (this.updInput) {
        // Set initial value if the input has a value
        if (this.updInput.value) {
          this.updValue = this.updInput.value;
          this.validateUpdValue(this.updInput);
        }

        // Add focus event listener to refresh balances
        this.updInput.addEventListener('focus', () => {
          refreshBalances();
        });

        // Add input event listener to update value and validate
        this.updInput.addEventListener('input', (e: Event) => {
          const input = e.target as SlInput;
          this.updValue = input.value;
          this.validateUpdValue(input);
        });
      }
    }

    /**
     * @deprecated Use setupUpdInput() instead
     * Handle UPD input focus event
     */
    protected handleUpdFocus() {
      refreshBalances();
    }

    /**
     * @deprecated Use setupUpdInput() instead
     * Handle UPD input change event
     * @param e Input event
     */
    protected handleUpdInput(e: Event) {
      const input = e.target as SlInput;
      this.updValue = input.value;
      this.validateUpdValue(input);
    }

    /**
     * Validate the current UPD value
     * @param input Optional input element to update CSS classes
     * @returns Error message or null if valid
     */
    protected validateUpdValue(input?: SlInput): string | null {
      const value = Number(this.updValue);
      const userBalance = getBalance('updraft');
      const minFee = updraftSettings.get().minFee;

      if (isNaN(value)) {
        this.updError = 'Enter a number';
      } else if (this.includeAntiSpamFee && value <= minFee) {
        this.updError = `Amount must be more than ${minFee} UPD to cover fees`;
      } else if (value > userBalance) {
        this.updError = `You have ${userBalance.toFixed(0)} UPD`;
      } else {
        this.updError = null;
      }

      if (input) {
        if (this.updError) {
          input.classList.add('invalid');
        } else {
          input.classList.remove('invalid');
        }
      }

      return this.updError;
    }

    /**
     * Handle UPD approval for a contract
     * @param contractAddress Contract address to approve
     * @param amount Amount to approve (defaults to total UPD supply)
     * @param onSuccess Callback to execute after successful approval
     */
    protected async handleUpdApproval(
      contractAddress: `0x${string}`,
      amount: bigint = parseUnits('1', 29),
      onSuccess?: () => void
    ) {
      const updAddress = updraftSettings.get().updAddress;
      if (!updAddress) return;

      this.approveTransaction.reset();
      this.approveDialog.show();

      try {
        const upd = new Upd(updAddress);
        this.approveTransaction.hash = await upd.write('approve', [
          contractAddress,
          amount,
        ]);

        // Set up success handler if provided
        if (onSuccess) {
          this.approveTransaction.addEventListener(
            'transaction-success',
            () => {
              this.approveDialog.hide();
              onSuccess();
            }
          );
        }
      } catch (e) {
        console.error('UPD approval error:', e);
      }
    }

    /**
     * Handle common transaction errors related to UPD and wallet connections
     * @param e Error object
     * @param contractAddress Contract address for approval
     * @param onApprovalSuccess Callback to execute after successful approval
     * @param onLowBalance Callback to execute when balance is insufficient
     * @returns Whether the error was handled
     */
    protected handleTransactionError(
      e: unknown,
      contractAddress: `0x${string}`,
      onApprovalSuccess?: () => void,
      onLowBalance?: () => void
    ): boolean {
      if (e instanceof Error) {
        // Handle connection errors
        if (
          e.message.startsWith('connection') ||
          e.message.includes('getChainId')
        ) {
          modal.open({ view: 'Connect' });
          return true;
        }
        // Handle UPD balance errors
        else if (e.message.includes('exceeds balance')) {
          if (onLowBalance) {
            onLowBalance();
            return true;
          }
          return false;
        }
        // Handle UPD allowance errors
        else if (e.message.includes('exceeds allowance')) {
          this.handleUpdApproval(contractAddress, undefined, onApprovalSuccess);
          return true;
        }
      }
      console.error('Transaction error:', e);
      return false;
    }

    /**
     * Called after the component's first update
     * Sets up the UPD input field event handlers
     */
    firstUpdated(changedProperties: Map<string | number | symbol, unknown>) {
      super.firstUpdated(changedProperties);
      this.setupUpdInput();
    }
  }

  // Cast the return type to preserve both the original superclass type
  // and the TokenHandlerElement type with its added properties and methods
  return TokenHandlerElement as Constructor<TokenHandlerElement> & T;
};
