import { LitElement, css } from 'lit';
import { SignalWatcher, html } from '@lit-labs/signals';
import { customElement, property, query, state } from 'lit/decorators.js';
import { parseUnits, formatUnits } from 'viem';

import type { SlInput } from '@shoelace-style/shoelace';
import type { SlDialog } from '@shoelace-style/shoelace';

import type { UpdDialog } from '@components/common/upd-dialog';

import { updraftSettings } from '@state/common';
import { getBalance, refreshBalances } from '@state/user/balances';
import { userAddress } from '@state/user';

import { modal } from '@utils/web3';
import { shortenAddress } from '@utils/address-utils';

import { Upd } from '@contracts/upd';
import { IContract } from '@contracts/contract';
import { ITransactionWatcher } from '@components/common/transaction-watcher';

/**
 * A component that provides token input capabilities.
 * Currently supports UPD tokens but designed to be extended for other tokens.
 *
 * Features:
 * - Validates input against balance and anti-spam fee requirements
 * - Handles token approvals and transactions
 * - Supports different approval strategies (unlimited for trusted contracts, exact for others)
 * - Identifies the Updraft contract by name in the approval dialog
 * - Provides options to show/hide input controls and dialogs
 * - Dispatches events for low balance conditions
 * - Exposes isLowBalance property for parent components to handle low balance UI
 * - Provides two slots for custom content based on balance state:
 *   - "low-balance": shown when balance is low or unknown
 *   - "sufficient-balance": shown when balance is sufficient
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <token-input></token-input>
 *
 * <!-- For creating an idea with custom balance slots -->
 * <token-input
 *   name="deposit"
 *   required
 *   spendingContract=${updraft.address}
 *   spendingContractName="Updraft"
 *   antiSpamFeeMode="variable"
 * >
 *   <sl-button slot="low-balance" variant="primary">Get more UPD</sl-button>
 *   <span slot="sufficient-balance">Balance is sufficient</span>
 * </token-input>
 *
 * <!-- For supporting an idea -->
 * <token-input
 *   name="support"
 *   required
 *   spendingContract=${ideaId}
 *   antiSpamFeeMode="variable"
 * ></token-input>
 *
 * <!-- Input only (no dialogs) -->
 * <token-input
 *   showDialogs="false"
 * ></token-input>
 *
 * <!-- Validation only (no input control) -->
 * <token-input
 *   showInputControl="false"
 *   .value=${someExternalValue}
 * ></token-input>
 * ```
 */
@customElement('token-input')
export class TokenInput extends SignalWatcher(LitElement) {
  static styles = css`
    .token-input-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .input-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .input-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
    }

    .input-row sl-input {
      flex: 1;
    }

    .input-row sl-input.invalid {
      --sl-input-border-color: var(--sl-color-danger-500);
      --sl-input-focus-ring-color: var(--sl-color-danger-200);
    }

    .fee-info {
      font-size: 0.875rem;
      color: var(--sl-color-neutral-900);
      white-space: nowrap;
    }

    .error {
      color: red;
      font-size: 0.8rem;
      padding-top: 0.25rem;
    }

    .slot-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `;

  // Token configuration with sensible defaults
  @property() tokenSymbol = 'UPD';
  @property() tokenName = 'updraft'; // Default to UPD
  @property() tokenAddress?: `0x${string}`; // Optional direct contract address

  // Spending contract configuration
  @property() spendingContract?: `0x${string}`;
  @property() spendingContractName?: string; // Optional friendly name for the spending contract

  // Approval strategy - can be explicitly set or computed
  @property() approvalStrategy?: 'unlimited' | 'exact';

  // Input configuration
  @property() name = 'token-amount';
  @property({ type: Boolean }) required = false;

  // Display options
  @property({ type: Boolean }) showInputControl = true; // Whether to show the input field
  @property({ type: Boolean }) showDialogs = true; // Whether to show dialogs

  // Anti-spam fee configuration - defaults to none
  @property() antiSpamFeeMode: 'none' | 'fixed' | 'variable' = 'none';

  // Public properties
  @property() value = '';

  // Internal state
  @state() private _error: string | null = null;
  @state() private _balance: number = 0;
  @state() private _isLowBalance: boolean = false;

  // Element references
  @query('sl-input') input!: SlInput;
  @query('upd-dialog') updDialog!: UpdDialog;
  @query('transaction-watcher.approve')
  approveTransaction!: ITransactionWatcher;
  @query('sl-dialog') approveDialog!: SlDialog;

  // Lifecycle methods
  connectedCallback() {
    super.connectedCallback();
    this.refreshBalance();
  }

  firstUpdated(changedProperties: Map<string, unknown>) {
    super.firstUpdated(changedProperties);
    // Initial validation if there's a value
    if (this.value) {
      this.validateValue();
    }
  }

  // Computed properties

  // Automatically determine if this is the Updraft contract
  private get isUpdraftContract(): boolean {
    if (!this.spendingContract) return false;

    const settings = updraftSettings.get();
    return (
      this.spendingContract.toLowerCase() === settings.updAddress?.toLowerCase()
    );
  }

  // Get the spending contract name for display
  private get spendingContractDisplayName(): string {
    if (this.spendingContractName) {
      return this.spendingContractName;
    }

    if (this.isUpdraftContract) {
      return 'Updraft';
    }

    return this.spendingContract
      ? shortenAddress(this.spendingContract)
      : 'the contract';
  }

  // Get effective approval strategy - use explicit value if set, otherwise compute
  private get effectiveApprovalStrategy(): 'unlimited' | 'exact' {
    // If explicitly set, use that value
    if (this.approvalStrategy) {
      return this.approvalStrategy;
    }

    // Otherwise compute based on contract
    return this.isUpdraftContract ? 'unlimited' : 'exact';
  }

  // Determine if anti-spam fee should be shown
  protected get showAntiSpamFee(): boolean {
    return this.tokenName === 'updraft' && this.antiSpamFeeMode !== 'none';
  }

  // Calculate anti-spam fee based on the selected mode
  protected get antiSpamFee(): number {
    // Only apply for UPD token
    if (!this.showAntiSpamFee) {
      return 0;
    }

    const settings = updraftSettings.get();
    const minFee = settings.minFee;

    if (this.antiSpamFeeMode === 'fixed') {
      return minFee;
    }

    // Variable mode - max of fixed fee or percentage of value
    const value = Number(this.value || 0);
    if (isNaN(value)) {
      return minFee;
    }

    const percentFee = value * settings.percentFee;
    return Math.max(minFee, percentFee);
  }

  // Get the token contract instance
  private getTokenContract(): IContract | null {
    // If tokenAddress is provided, use it directly
    if (this.tokenAddress) {
      // TODO: Add support for custom tokens
      return null;
    }

    // Otherwise use the named token
    if (this.tokenName === 'updraft') {
      const updAddress = updraftSettings.get().updAddress;
      if (updAddress) {
        return new Upd(updAddress);
      }
    }

    return null;
  }

  // Refresh the token balance
  public refreshBalance() {
    if (this.tokenName === 'updraft') {
      // Use existing balance service for UPD
      refreshBalances();
      this._balance = getBalance('updraft');
    } else if (this.tokenAddress) {
      // For custom token addresses, fetch balance directly
      const contract = this.getTokenContract();
      if (contract) {
        const address = userAddress.get();
        if (address) {
          contract
            .read('balanceOf', [address])
            .then((balance: unknown) => {
              this._balance = Number(formatUnits(balance as bigint, 18));
              this.validateValue(); // Re-validate with new balance
            })
            .catch((err: unknown) =>
              console.error('Error fetching token balance:', err)
            );
        }
      }
    }
  }

  // Get the appropriate approval amount based on strategy and contract
  private getApprovalAmount(): bigint {
    // For unlimited approval strategy, approve the total supply
    if (this.effectiveApprovalStrategy === 'unlimited') {
      return parseUnits('1', 29); // Total supply of UPD
    }

    // For exact approval strategy, only approve the exact amount
    const value = Number(this.value || 0);
    if (isNaN(value) || value <= 0) return BigInt(0);

    return parseUnits(value.toString(), 18);
  }

  get needMoreTokens(): boolean {
    const value = Number(this.value || 0);
    const fee = this.showAntiSpamFee ? this.antiSpamFee : 0;

    return (
      isNaN(value) ||
      value === 0 ||
      value > this._balance ||
      (this.showAntiSpamFee && value <= fee)
    );
  }

  // Validate the current value
  private validateValue() {
    const value = Number(this.value);

    // Update the low balance state based on the needMoreTokens check
    this._isLowBalance = this.needMoreTokens;

    // If low balance, dispatch the event
    if (this._isLowBalance) {
      this.dispatchEvent(
        new CustomEvent('low-balance', {
          bubbles: true,
          composed: true,
        })
      );
    }

    // Set appropriate error message
    if (this.value === '') {
      this._error = null;
    } else if (isNaN(value)) {
      this._error = 'Enter a number';
    } else if (value <= 0) {
      this._error = 'Amount must be greater than 0';
    } else if (this.showAntiSpamFee && value <= this.antiSpamFee) {
      this._error = `Amount must be more than ${this.antiSpamFee} ${this.tokenSymbol} to cover fees`;
    } else if (value > this._balance) {
      this._error = `You have ${this._balance.toFixed(0)} ${this.tokenSymbol}`;
    } else {
      this._error = null;
    }

    // Update input styling
    if (this.input) {
      if (this._error) {
        this.input.classList.add('invalid');
      } else {
        this.input.classList.remove('invalid');
      }
    }
  }

  // Handle input events
  private handleInput(e: Event) {
    const input = e.target as SlInput;
    this.value = input.value;
    this.validateValue();
  }

  // Handle focus events
  private handleFocus() {
    this.refreshBalance();
  }

  // Handle token approval
  private async handleApproval(onSuccess?: () => void) {
    if (!this.spendingContract) return;

    const contract = this.getTokenContract();
    if (!contract) return;

    this.approveTransaction.reset();
    this.approveDialog.show();

    try {
      const approvalAmount = this.getApprovalAmount();

      this.approveTransaction.hash = (await contract.write('approve', [
        this.spendingContract,
        approvalAmount,
      ])) as `0x${string}`;

      // Set up success handler if provided
      if (onSuccess) {
        this.approveTransaction.addEventListener(
          'transaction-success',
          () => {
            this.approveDialog.hide();
            onSuccess();
          },
          { once: true }
        );
      }
    } catch (e) {
      console.error(`${this.tokenSymbol} approval error:`, e);
    }
  }

  // Public API for error handling
  public handleTransactionError(
    e: unknown,
    onApprovalSuccess?: () => void,
    onLowBalance?: () => void
  ): boolean {
    if (e instanceof Error) {
      // Connection errors
      if (
        e.message.startsWith('connection') ||
        e.message.includes('getChainId')
      ) {
        modal.open({ view: 'Connect' });
        return true;
      }
      // Balance errors
      else if (e.message.includes('exceeds balance')) {
        if (onLowBalance) {
          onLowBalance();
        } else if (this.tokenName === 'updraft') {
          // Default behavior for UPD
          this.updDialog.show();
        }
        return true;
      }
      // Allowance errors
      else if (e.message.includes('exceeds allowance')) {
        if (this.spendingContract) {
          this.handleApproval(onApprovalSuccess);
          return true;
        }
      }
    }
    console.error('Transaction error:', e);
    return false;
  }

  get error(): string | null {
    return this._error;
  }

  get valid(): boolean {
    return !this._error;
  }

  get balance(): number {
    return this._balance;
  }

  get isLowBalance(): boolean {
    return this._isLowBalance;
  }

  // When value property changes, validate it
  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this.validateValue();
    }
  }

  render() {
    const approvalDescription =
      this.effectiveApprovalStrategy === 'unlimited'
        ? `allow ${this.spendingContractDisplayName} to spend your ${this.tokenSymbol} tokens`
        : `allow ${this.spendingContractDisplayName} to spend ${this.value} ${this.tokenSymbol}`;

    return html`
      <div class="token-input-container">
        ${this.showInputControl
          ? html`
              <div class="input-container">
                <div class="input-row">
                  <sl-input
                    name=${this.name}
                    ?required=${this.required}
                    autocomplete="off"
                    .value=${this.value}
                    @focus=${this.handleFocus}
                    @input=${this.handleInput}
                    class=${this._error ? 'invalid' : ''}
                  ></sl-input>
                  <span>${this.tokenSymbol}</span>

                  <div class="slot-container">
                    ${this._isLowBalance
                      ? html` <slot name="low-balance"></slot>`
                      : html` <slot name="sufficient-balance"></slot>`}
                  </div>
                </div>
                ${this.showAntiSpamFee
                  ? html` <div class="fee-info">
                      <span
                        >Anti-Spam Fee: ${this.antiSpamFee}
                        ${this.tokenSymbol}</span
                      >
                    </div>`
                  : html``}
              </div>
              ${this._error
                ? html` <div class="error">${this._error}</div>`
                : html``}
            `
          : html``}
      </div>

      ${this.tokenName === 'updraft' && this.showDialogs
        ? html` <upd-dialog></upd-dialog>`
        : html``}
      ${this.showDialogs
        ? html`
            <sl-dialog label="Set Allowance">
              <p>
                Before you can proceed, you need to sign a transaction to
                ${approvalDescription}.
              </p>
              <transaction-watcher class="approve"></transaction-watcher>
            </sl-dialog>
          `
        : html``}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'token-input': TokenInput;
  }
}
