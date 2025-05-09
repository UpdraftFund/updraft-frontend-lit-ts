import { LitElement, css } from 'lit';
import { SignalWatcher, html } from '@lit-labs/signals';
import { customElement, property, query, state } from 'lit/decorators.js';
import { parseUnits, formatUnits } from 'viem';
import { Task } from '@lit/task';

import type { SlInput } from '@shoelace-style/shoelace';
import type { SlDialog } from '@shoelace-style/shoelace';

import type { UpdDialog } from '@components/common/upd-dialog';

import { updraftSettings } from '@state/common';
import { getBalance, refreshBalances } from '@state/user/balances';
import { userAddress } from '@state/user';

import { modal } from '@utils/web3';
import { shortenAddress } from '@utils/address-utils';
import { shortNum } from '@utils/short-num';

import { Upd } from '@contracts/upd';
import { ERC20 } from '@contracts/erc20';
import { IContract } from '@contracts/contract';
import { ITransactionWatcher } from '@components/common/transaction-watcher';

/**
 * Interface for the token-input component.
 * Defines the public API that can be used by parent components.
 */
export interface ITokenInput {
  // Token configuration
  tokenSymbol: string;
  tokenName: string;
  tokenAddress?: `0x${string}`;

  // Spending contract configuration
  spendingContract?: `0x${string}`;
  spendingContractName?: string;

  // Approval strategy
  approvalStrategy?: 'unlimited' | 'exact';

  // Input configuration
  name: string;
  required: boolean;

  // Display options
  showInputControl: boolean;
  showDialogs: boolean;

  // Anti-spam fee configuration
  antiSpamFeeMode: 'none' | 'fixed' | 'variable';

  // Value and state
  value: string;

  // Public getters
  readonly error: string | null;
  readonly valid: boolean;
  readonly balance: number;
  readonly isLowBalance: boolean;

  // Public methods
  handleTransactionError(
    e: unknown,
    onApprovalSuccess?: () => void,
    onLowBalance?: () => void
  ): boolean;
}

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
export class TokenInput
  extends SignalWatcher(LitElement)
  implements ITokenInput
{
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
      gap: 1rem;
      flex: 1;
    }

    .input-row sl-input {
      flex: none;
      width: calc(10ch + var(--sl-input-spacing-medium) * 2);
      box-sizing: content-box;
    }

    .input-row sl-input::part(input) {
      text-align: right;
    }

    .input-row sl-input.invalid {
      --sl-input-border-color: var(--sl-color-danger-500);
      --sl-input-focus-ring-color: var(--sl-color-danger-200);
    }

    .fee-info {
      font-size: 0.875rem;
      color: var(--sl-color-neutral-900);
      white-space: nowrap;
      margin-left: 0.5rem;
    }

    .error {
      color: red;
      font-size: 0.8rem;
      padding-top: 0.25rem;
      min-height: 1.2rem; /* Reserve space for error message */
    }

    .error-placeholder {
      min-height: 1.2rem; /* Same height as error message */
      visibility: hidden;
    }

    .slot-container {
      display: flex;
      align-items: center;
      gap: 1rem;
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
      return new ERC20(this.tokenAddress);
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

  private refreshBalance = new Task(
    this,
    async ([address, tokenName, tokenAddress]) => {
      let balance = 0;

      if (address) {
        if (tokenName === 'updraft') {
          // For UPD token, use the global balances state
          await refreshBalances();
          balance = getBalance('updraft');
        } else if (tokenAddress) {
          // For custom token addresses, fetch balance directly from contract
          const contract = this.getTokenContract();
          if (contract) {
            try {
              const rawBalance = await contract.read('balanceOf', [address]);
              balance = Number(formatUnits(rawBalance as bigint, 18));
            } catch (err) {
              console.error('Error fetching token balance:', err);
            }
          }
        }
      }

      // Update component state with the new balance
      this._balance = balance;
      this.validateValue();
      return balance;
    },
    // Include all dependencies that should trigger a refresh
    () => [userAddress.get(), this.tokenName, this.tokenAddress]
  );

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

  private checkLowBalance(): boolean {
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

    this._isLowBalance = this.checkLowBalance();

    if (this._isLowBalance) {
      this.dispatchEvent(
        new CustomEvent('low-balance', {
          bubbles: true,
          composed: true,
        })
      );
    }

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

    if (this.input) {
      if (this._error) {
        this.input.classList.add('invalid');
      } else {
        this.input.classList.remove('invalid');
      }
    }
  }

  private handleInput(e: Event) {
    const input = e.target as SlInput;
    this.value = input.value;
    this.validateValue();
  }

  private handleFocus() {
    this.refreshBalance.run();
  }

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

  // Lifecycle methods
  connectedCallback() {
    super.connectedCallback();
    this.refreshBalance.run();
  }

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
                    ${this.refreshBalance.render({
                      complete: () =>
                        this._isLowBalance
                          ? html` <slot name="low-balance"></slot>`
                          : html` <slot name="sufficient-balance"></slot>`,
                      error: () => html` <slot name="low-balance"></slot>`,
                    })}
                  </div>

                  ${this.showAntiSpamFee
                    ? html`<div class="fee-info">
                        <span
                          >Anti-Spam Fee: ${shortNum(this.antiSpamFee)}
                          ${this.tokenSymbol}</span
                        >
                      </div>`
                    : html``}
                </div>
              </div>
              ${this._error
                ? html` <div class="error">${this._error}</div>`
                : html` <div class="error-placeholder">No error</div>`}
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

// Export the TokenInput class as the default implementation of ITokenInput
export { TokenInput as TokenInputElement };
