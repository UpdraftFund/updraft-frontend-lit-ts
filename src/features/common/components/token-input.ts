import { LitElement, css } from 'lit';
import { SignalWatcher, html } from '@lit-labs/signals';
import { customElement, property, query, state } from 'lit/decorators.js';
import { parseUnits, formatUnits, maxUint256 } from 'viem';
import { Task } from '@lit/task';

// Use a type based on the standard ValidityState interface
// This creates a type with the same properties as ValidityState but makes them writable
type ValidityStateFlags = Partial<Record<keyof ValidityState, boolean>>;

import type { SlInput } from '@shoelace-style/shoelace';
import type { SlDialog } from '@shoelace-style/shoelace';

import type { UpdDialog } from '@components/common/upd-dialog';
import { ITransactionWatcher } from '@components/common/transaction-watcher';

import { dialogStyles } from '@styles/dialog-styles';

import { updraftSettings } from '@state/common';
import { getBalance, refreshBalances } from '@state/user/balances';
import { userAddress } from '@state/user';

import { modal } from '@utils/web3';
import { shortenAddress, shortNum } from '@utils/format-utils';

import { Upd } from '@contracts/upd';
import { ERC20 } from '@contracts/erc20';
import { IContract } from '@contracts/contract';

/**
 * Interface for the token-input component.
 * Defines the public API that can be used by parent components.
 */
export interface ITokenInput {
  // Token configuration
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
  readonly tokenSymbol: string | null;

  // Public methods
  handleTransactionError(
    e: unknown,
    onApprovalSuccess?: () => void,
    onLowBalance?: () => void
  ): boolean;

  // Form validation methods
  checkValidity(): boolean;
  reportValidity(): boolean;
  readonly form: HTMLFormElement | null;
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
 * - Provides two slots for custom content based on validation state:
 *   - "invalid": shown when the input is invalid (e.g., required but empty, insufficient balance)
 *   - "valid": shown when the input is valid
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <token-input></token-input>
 *
 * <!-- For creating an idea with custom validation slots -->
 * <token-input
 *   name="deposit"
 *   required
 *   spendingContract=${updraft.address}
 *   spendingContractName="Updraft"
 *   antiSpamFeeMode="variable"
 * >
 *   <sl-button slot="invalid" variant="primary">Get more UPD</sl-button>
 *   <span slot="valid">Balance is sufficient</span>
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
  // Indicate that this component can be associated with forms
  static formAssociated = true;

  // ElementInternals for form association
  private internals: ElementInternals;
  static styles = [
    dialogStyles,
    css`
      .input-container {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .input-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1rem;
      }
      .input-row sl-input {
        flex: none;
        width: calc(10ch + var(--sl-input-spacing-medium) * 2);
        box-sizing: content-box;
      }
      .input-row sl-input::part(input) {
        text-align: right;
      }
      .input-container .input-row sl-input.invalid::part(base) {
        border-color: var(--sl-color-danger-500);
      }
      .input-container .input-row sl-input.invalid:focus-within::part(base) {
        box-shadow: 0 0 0 var(--sl-focus-ring-width) var(--sl-color-danger-500);
      }
      .fee-info {
        font-size: 0.875rem;
        color: var(--sl-color-neutral-900);
        white-space: nowrap;
        margin-left: 0.5rem;
      }
      .info-icon {
        font-size: 0.75rem;
        cursor: help;
      }
      .error {
        color: red;
        font-size: 0.8rem;
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
    `,
  ];

  // Token configuration
  @property() tokenAddress?: `0x${string}`; // Optional direct contract address

  // Spending contract configuration
  @property() spendingContract?: `0x${string}`;
  @property() spendingContractName?: string; // Optional friendly name for the spending contract

  // Approval strategy - can be explicitly set or computed
  @property() approvalStrategy?: 'unlimited' | 'exact';

  // Input configuration
  @property() name = 'token-amount';
  @property({ type: Boolean, reflect: true }) required = false;

  // Display options
  @property({ type: Boolean }) showInputControl = true; // Whether to show the input field
  @property({ type: Boolean }) showDialogs = true; // Whether to show dialogs

  // Anti-spam fee configuration - defaults to none
  @property() antiSpamFeeMode: 'none' | 'fixed' | 'variable' = 'none';

  // Public properties
  @property() value = '';

  // Internal state
  @state() private _symbol: string | null = null;
  @state() private _error: string | null = null;
  @state() private _balance: number = 0;
  @state() private _validationMessage: string = '';

  // Element references
  @query('sl-input', true) input!: SlInput;
  @query('upd-dialog', true) updDialog!: UpdDialog;
  @query('transaction-watcher.approve', true)
  approveTransaction!: ITransactionWatcher;
  @query('sl-dialog', true) approveDialog!: SlDialog;

  private fetchTokenSymbol = new Task(
    this,
    async ([tokenAddress]) => {
      if (tokenAddress) {
        if (tokenAddress === updraftSettings.get().updAddress) {
          this._symbol = 'UPD';
        } else {
          try {
            const contract = new ERC20(tokenAddress);
            this._symbol = (await contract.read('symbol')) as string | null;
          } catch (err) {
            console.error('Error fetching token symbol:', err);
            return shortenAddress(tokenAddress);
          }
        }
      } else {
        this._symbol = 'UPD';
      }
    },
    () => [this.tokenAddress]
  );

  private refreshBalance = new Task(
    this,
    async ([address, tokenAddress]) => {
      let balance = 0;

      if (address) {
        if (this.isUpdraftToken) {
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

      this._balance = balance;
      this.validate();
    },
    // Include all dependencies that should trigger a refresh
    () => [userAddress.get(), this.tokenAddress]
  );

  // Computed properties

  // Automatically determine if this is the Updraft contract
  private get isUpdraftContract(): boolean {
    if (!this.spendingContract) return false;

    return (
      this.spendingContract.toLowerCase() ===
      updraftSettings.get().updraftAddress.toLowerCase()
    );
  }

  // Check if the current token is the Updraft token
  private get isUpdraftToken(): boolean {
    return this._symbol === 'UPD';
  }

  private get invalid() {
    return this._error && this.value !== '';
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
    return this.isUpdraftToken && this.antiSpamFeeMode !== 'none';
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

  private get approvalAmount(): bigint {
    if (this.effectiveApprovalStrategy === 'unlimited') {
      return maxUint256;
    }

    const value = Number(this.value || 0);
    if (isNaN(value) || value <= 0) return BigInt(0);

    return parseUnits(value.toString(), 18);
  }

  private get approvalDescription() {
    let description = `Before you can proceed, you need to sign a transaction to allow "${this.spendingContractDisplayName}" to spend `;
    if (this.effectiveApprovalStrategy === 'unlimited') {
      description += `any amount of your ${this._symbol} tokens`;
    } else {
      description += `${this.value} ${this._symbol}`;
    }
    return description;
  }

  // Get the token contract instance
  private getTokenContract(): IContract | null {
    // If tokenAddress is provided, use it directly
    if (this.tokenAddress) {
      return new ERC20(this.tokenAddress);
    }

    // Otherwise use the Updraft token
    const updAddress = updraftSettings.get().updAddress;
    if (updAddress) {
      return new Upd(updAddress);
    }

    return null;
  }

  private validate() {
    const value = Number(this.value);

    // Prepare validity state object
    const validityState: ValidityStateFlags = {};

    // Check if the field is required and empty
    if (
      this.required &&
      (this.value === '' || this.value === null || this.value === undefined)
    ) {
      this._error = 'This field is required';
      this._validationMessage = 'This field is required';
      validityState.valueMissing = true;
    } else if (
      this.value === '' ||
      this.value === null ||
      this.value === undefined
    ) {
      this._error = null;
      this._validationMessage = '';
    } else if (isNaN(value)) {
      this._error = 'Enter a number';
      this._validationMessage = 'Please enter a valid number';
      validityState.typeMismatch = true;
    } else if (this.showAntiSpamFee && value <= this.antiSpamFee) {
      this._error = `Amount must be more than ${this.antiSpamFee} ${this._symbol} to cover fees`;
      this._validationMessage = `Amount must be more than ${this.antiSpamFee} ${this._symbol} to cover fees`;
      validityState.customError = true;
    } else if (value > this._balance) {
      this._error = `You have ${this._balance.toFixed(0)} ${this._symbol}`;
      this._validationMessage = `Insufficient balance. You have ${this._balance.toFixed(0)} ${this._symbol}`;
      validityState.customError = true;
    } else {
      this._error = null;
      this._validationMessage = '';
    }

    // Update the element's validity state using ElementInternals
    if (this._error) {
      this.internals.setValidity(
        validityState,
        this._validationMessage,
        this.input || undefined
      );
    } else {
      this.internals.setValidity({});
    }

    // Set form value
    if (this.value) {
      this.internals.setFormValue(this.value);
    } else {
      this.internals.setFormValue('');
    }

    // Dispatch a change event to notify the form of validity changes
    this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }

  private handleInput(e: Event) {
    const input = e.target as SlInput;
    this.value = input.value;
    this.validate();
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
      this.approveTransaction.hash = (await contract.write('approve', [
        this.spendingContract,
        this.approvalAmount,
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
      console.error(`Token approval error:`, e);
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
        } else if (this.isUpdraftToken) {
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

  get tokenSymbol(): string | null {
    return this._symbol;
  }

  // Form validation methods
  checkValidity(): boolean {
    this.validate();
    return this.internals.checkValidity();
  }

  reportValidity(): boolean {
    this.validate();
    return this.internals.reportValidity();
  }

  // Getter for form property
  get form(): HTMLFormElement | null {
    return this.internals.form;
  }

  // Called when the element is associated with a form
  formAssociatedCallback(form: HTMLFormElement) {
    // When the form is reset, clear our value
    form.addEventListener('reset', () => {
      this.value = '';
      this._error = null;
      this._validationMessage = '';
      this.internals.setValidity({});
      if (this.input) {
        this.input.classList.remove('invalid');
      }
    });
  }

  // Form state restoration callback
  formStateRestoreCallback(state: string) {
    if (state) {
      this.value = state;
      this.fetchTokenSymbol.run().then(() => {
        this.refreshBalance.run();
      });
    }
  }

  constructor() {
    super();
    // Initialize ElementInternals
    this.internals = this.attachInternals();
  }

  // Lifecycle methods
  connectedCallback() {
    super.connectedCallback();
    this.fetchTokenSymbol.run().then(() => {
      this.refreshBalance.run();
    });

    // Add a form-associated validation listener
    if (this.closest('form')) {
      this.addEventListener('invalid', () => {
        this.validate();
      });
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('value')) {
      this.fetchTokenSymbol.run().then(() => {
        this.refreshBalance.run();
      });
    }
  }

  render() {
    return html`
      <div class="input-container">
        ${this.showInputControl
          ? html`
              <div class="input-row">
                <sl-input
                  name=${this.name}
                  ?required=${this.required}
                  autocomplete="off"
                  .value=${this.value}
                  @focus=${this.handleFocus}
                  @input=${this.handleInput}
                  class=${this.invalid ? 'invalid' : ''}
                ></sl-input>
                <span>${this._symbol}</span>

                <div class="slot-container">
                  ${this.invalid
                    ? html` <slot name="invalid"></slot>`
                    : html` <slot name="valid"></slot>`}
                </div>

                ${this.showAntiSpamFee
                  ? html` <div class="fee-info">
                      <span
                        >Anti-Spam Fee: ${shortNum(this.antiSpamFee)}
                        ${this._symbol}</span
                      >
                      <sl-tooltip
                        content="This fee keeps spam out of Updraft. The fee is fixed at 1 UPD for editing a Solution or profile, and the greater of 1 UPD or 1% for supporting an Idea. All anti-spam fees go to a faucet for new users--which you can collect from the Updraft Discord."
                      >
                        <span class="info-icon">ℹ️</span>
                      </sl-tooltip>
                    </div>`
                  : html``}
              </div>
              ${this.invalid
                ? html` <div class="error">${this._error}</div>`
                : html` <div class="error-placeholder">No error</div>`}
            `
          : html``}
      </div>

      ${this.isUpdraftToken && this.showDialogs
        ? html` <upd-dialog></upd-dialog>`
        : html``}
      ${this.showDialogs
        ? html`
            <sl-dialog label="Set Allowance">
              <p>${this.approvalDescription}.</p>
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
