import { customElement, property, query, state } from 'lit/decorators.js';
import { html, css } from 'lit';
import { consume } from '@lit/context';

import { parseUnits, toHex, trim } from 'viem';
import dayjs from 'dayjs';

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/range/range.js';
import type { SlDialog, SlInput, SlRange } from '@shoelace-style/shoelace';
import { formToJson, SaveableForm } from '@components/common/saveable-form';

import { dialogStyles } from '@styles/dialog-styles';

import {
  balanceContext,
  RequestBalanceRefresh,
  updraftSettings as updraftSettingsContext,
} from '@state/common/context';
import { userContext, UserState } from '@state/user/user';
import { topBarContent } from '@state/layout';

import {
  TransactionSuccess,
  TransactionWatcher,
} from '@components/common/transaction-watcher';
import { ShareDialog } from '@components/common/share-dialog';
import { UpdDialog } from '@components/common/upd-dialog';
import '@layout/page-heading';
import '@components/common/transaction-watcher';
import '@components/common/upd-dialog';
import '@components/common/share-dialog';
import '@components/common/label-with-hint';

import solutionSchema from '@schemas/solution-schema.json';
import { updraft } from '@contracts/updraft';

import { UpdraftSettings } from '@/types';
import { Balances } from '@/features/user/types/current-user';
import { IdeaDocument } from '@gql';
import urqlClient from '@utils/urql-client';
import { TaskStatus } from '@lit/task';

interface SolutionFormData {
  deadline: string;
  deposit: string;
  goal: string;
  'funding-token': string;
  reward: string;
  [key: string]: string;
}

@customElement('create-solution')
export class CreateSolution extends SaveableForm {
  @property() ideaId!: string;

  @query('sl-range', true) rewardRange!: SlRange;
  @query('upd-dialog', true) updDialog!: UpdDialog;
  @query('transaction-watcher.submit', true)
  submitTransaction!: TransactionWatcher;
  @query('transaction-watcher.approve', true)
  approveTransaction!: TransactionWatcher;
  @query('share-dialog', true) shareDialog!: ShareDialog;
  @query('sl-dialog', true) approveDialog!: SlDialog;

  @consume({ context: balanceContext, subscribe: true })
  userBalances!: Balances;
  @consume({ context: updraftSettingsContext, subscribe: true })
  updraftSettings!: UpdraftSettings;
  @consume({ context: userContext, subscribe: true })
  userState!: UserState;

  @state() private depositError: string | null = null;
  @state() private antiSpamFee?: string;

  private resizeObserver!: ResizeObserver;

  static styles = [
    dialogStyles,
    css`
      .container {
        display: flex;
        flex: auto;
        overflow: hidden;
      }

      main {
        flex: 1;
        box-sizing: border-box;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        margin: 1.5rem 3rem;
      }

      .deposit-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 0.25rem;
      }

      .deposit-row > sl-button {
        flex-shrink: 0; /* Prevents the button from shrinking */
      }

      .reward-container {
        display: flex;
        flex-direction: column;
        gap: 2.5rem;
      }

      .range-and-labels {
        display: flex;
        gap: 1rem;
      }

      .left-label,
      .right-label {
        font-size: 0.92rem;
        color: var(--main-foreground);
      }

      .reward-container sl-range {
        --track-color-active: var(--accent);
        --track-color-inactive: var(--control-background);
        --thumb-size: 22px;
        --tooltip-offset: 8px;
        width: 100%;
        max-width: 400px;
        height: 3.5rem;
      }

      .reward-container sl-range::part(input) {
        border-radius: 20px;
      }

      .reward-container sl-range::part(tooltip) {
        /* Make tooltip always visible */
        opacity: 1 !important;
        visibility: visible !important;

        background-color: transparent; /* No background for the tooltip */
        color: var(--main-foreground);
        font-size: 0.875rem;
        font-weight: bold;
      }

      .reward-container sl-range::part(tooltip)::after {
        /* Hide the tooltip arrow */
        display: none;
        visibility: hidden;
      }

      .error {
        color: red;
        font-size: 0.8rem;
        padding-top: 0.25rem;
      }

      sl-input[name='deposit'] {
        flex: none;
        width: calc(10ch + var(--sl-input-spacing-medium) * 2);
        box-sizing: content-box;
      }

      sl-input[name='deposit']::part(input) {
        text-align: right;
      }

      sl-input[name='deposit'].invalid {
        --sl-input-focus-ring-color: red;
      }

      /* Responsive behavior for smaller screens */
      @media (max-width: 768px) {
        .container {
          flex-direction: column;
        }

        form {
          margin: 1rem;
        }
      }
    `,
  ];

  private readonly addIdeaToHeading = async () => {
    if (this.ideaId) {
      const result = await urqlClient.query(IdeaDocument, {
        ideaId: this.ideaId,
      });
      const ideaData = result.data?.idea;
      if (ideaData) {
        topBarContent.set(html`
          <page-heading
            >Create a new Solution
            <a href="/idea/${this.ideaId}">for ${ideaData.name}</a>
          </page-heading>
        `);
      }
    }
  };

  private handleDepositFocus() {
    this.dispatchEvent(new RequestBalanceRefresh());
  }

  private handleDepositInput(e: Event) {
    const input = e.target as SlInput;
    const value = Number(input.value);
    const userBalance = Number(
      this.userBalances?.updraft?.balance || 'Infinity'
    );
    const minFee = this.updraftSettings.minFee;

    if (isNaN(value)) {
      this.depositError = 'Enter a number';
    } else if (value <= minFee) {
      this.depositError = `Deposit must be more than ${minFee} UPD to cover fees`;
    } else if (value > userBalance) {
      this.depositError = `You have ${userBalance} UPD`;
    } else {
      this.depositError = null;
    }

    if (this.depositError) {
      input.classList.add('invalid');
    } else {
      input.classList.remove('invalid');
    }

    let fee;
    if (isNaN(value)) {
      fee = minFee;
    } else {
      fee = Math.max(minFee, value * this.updraftSettings.percentFee);
    }
    this.antiSpamFee = fee.toFixed(2);
  }

  private handleGoalInput(e: Event) {
    const input = e.target as SlInput;
    const value = input.value;

    // Ensure the goal is a valid number
    if (isNaN(Number(value)) && value !== '') {
      input.style.setProperty('--sl-input-focus-ring-color', 'red');
    } else {
      input.style.removeProperty('--sl-input-focus-ring-color');
    }
  }

  private handleFundingTokenInput(e: Event) {
    const input = e.target as SlInput;
    const value = input.value;

    // Basic validation for Ethereum address format
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(value) && value !== '') {
      input.style.setProperty('--sl-input-focus-ring-color', 'red');
    } else {
      input.style.removeProperty('--sl-input-focus-ring-color');
    }
  }

  private syncRangeTooltip = () => {
    // Hack to sync the tooltip
    this.rewardRange.focus();
    this.rewardRange.syncRange();
    this.rewardRange.blur();
  };

  private handleFormSubmit(e: Event) {
    e.preventDefault(); // Prevent the default form submission when Enter is pressed
  }

  private async handleSubmit(event: Event) {
    event.preventDefault();
    const formData = formToJson(
      'create-solution',
      solutionSchema
    ) as SolutionFormData;

    try {
      // Convert deadline to Unix timestamp
      const deadline = formData.deadline
        ? dayjs(formData.deadline).unix()
        : Math.floor(Date.now() / 1000) + 86400; // Default to 24 hours from now

      // Parse deposit and goal amounts
      const deposit = parseUnits(formData.deposit || '0', 18);
      const goal = parseUnits(formData.goal || '0', 18);

      // Don't allow overlapping transactions
      if (
        this.submitTransaction.transactionTask.status !== TaskStatus.PENDING
      ) {
        this.submitTransaction.hash = await updraft.write('createSolution', [
          this.ideaId,
          formData['funding-token'],
          deposit,
          goal,
          deadline,
          BigInt(
            (Number(formData.reward) *
              Number(this.updraftSettings.percentScale)) /
              100
          ),
          toHex(JSON.stringify(formData)),
        ]);
      }
    } catch (error) {
      console.error('Error submitting solution:', error);
    }
  }

  private async handleSubmitSuccess(t: TransactionSuccess) {
    const address = t.receipt?.logs?.[0]?.topics?.[1];
    if (address) {
      const solutionData = formToJson('create-solution', solutionSchema);
      this.shareDialog.url = `${window.location.origin}/solution/${trim(address)}?ideaId=${this.ideaId}`;
      this.shareDialog.topic = solutionData.name as string;
      this.shareDialog.action = 'created a Solution';
      this.shareDialog.show();
    }
  }

  private nextButtonClick(e: MouseEvent) {
    const form = this.form;
    if (!form.checkValidity()) {
      e.preventDefault(); // If the form is invalid, prevent the click
      form.reportValidity(); // Show validation messages
      return;
    }

    // Save the form data to localStorage for the profile creation step
    const formData = formToJson('create-solution', solutionSchema);
    localStorage.setItem('create-solution-form', JSON.stringify(formData));
  }

  firstUpdated(changedProperties: Map<string | number | symbol, unknown>) {
    super.firstUpdated(changedProperties);

    this.addIdeaToHeading();

    this.rewardRange.tooltipFormatter = (value: number) => `${value}%`;
    this.rewardRange.defaultValue = 50;
    this.rewardRange.updateComplete.then(this.syncRangeTooltip);

    this.resizeObserver = new ResizeObserver(this.syncRangeTooltip);
    this.resizeObserver.observe(this.rewardRange);
  }

  constructor() {
    super();
    topBarContent.set(html`
      <page-heading>Create a new Solution</page-heading>
    `);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
  }

  render() {
    return html`
      <div class="container">
        <main>
          <form name="create-solution" @submit=${this.handleFormSubmit}>
            <sl-input
              name="name"
              required
              autocomplete="off"
              placeholder="My Solution Name"
            >
              <label-with-hint
                slot="label"
                label="Name*"
                hint="A short name for your solution"
              ></label-with-hint>
            </sl-input>

            <sl-textarea
              name="description"
              resize="auto"
              placeholder="Describe your solution in detail..."
            >
              <label-with-hint
                slot="label"
                label="Description"
                hint="A description of your solution"
              ></label-with-hint>
            </sl-textarea>

            <sl-input
              name="funding-token"
              required
              autocomplete="off"
              @input=${this.handleFundingTokenInput}
              placeholder="0x..."
            >
              <label-with-hint
                slot="label"
                label="Funding Token*"
                hint="The address of the token you want to use to fund your solution"
              ></label-with-hint>
            </sl-input>

            <sl-input
              name="goal"
              required
              autocomplete="off"
              @input=${this.handleGoalInput}
              placeholder="1000"
            >
              <label-with-hint
                slot="label"
                label="Goal*"
                hint="The amount of funding you want to raise"
              ></label-with-hint>
            </sl-input>

            <sl-input type="date" name="deadline" required autocomplete="off">
              <label-with-hint
                slot="label"
                label="Deadline*"
                hint="Select the deadline for your solution. This is the date 
                by which your funding goalshould be reached."
              ></label-with-hint>
            </sl-input>

            <div class="deposit-container">
              <label-with-hint
                label="Stake"
                hint="Use staking to attract more funders. If you fail to reach 
                your funding goal, this amount will be distributed to your funders."
              >
              </label-with-hint>
              <div class="deposit-row">
                <sl-input
                  name="stake"
                  autocomplete="off"
                  @focus=${this.handleDepositFocus}
                  @input=${this.handleDepositInput}
                  placeholder="10"
                >
                </sl-input>
                <span>UPD</span>
                <sl-button
                  variant="primary"
                  @click=${() => this.updDialog.show()}
                  >Get more UPD
                </sl-button>
                ${this.antiSpamFee
                  ? html` <span>Anti-Spam Fee: ${this.antiSpamFee} UPD</span>`
                  : ''}
              </div>
              ${this.depositError
                ? html` <div class="error">${this.depositError}</div>`
                : ''}
            </div>

            <input type="hidden" name="reward" value="50" />

            <input type="hidden" name="ideaId" value="${this.ideaId}" />

            <sl-button
              href="/submit-profile-and-create-solution"
              variant="primary"
              @click=${this.nextButtonClick}
              >Next: Create your Profile
            </sl-button>
          </form>
          <sl-dialog label="Set Allowance">
            <p>
              Before you can submit your solution, you need to sign a
              transaction to allow Updraft to spend your UPD tokens.
            </p>
            <transaction-watcher
              class="approve"
              @transaction-success=${this.handleSubmit}
            ></transaction-watcher>
          </sl-dialog>
          <transaction-watcher
            class="submit"
            @transaction-success=${this.handleSubmitSuccess}
          ></transaction-watcher>
          <upd-dialog></upd-dialog>
          <share-dialog></share-dialog>
        </main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'create-solution': CreateSolution;
  }
}
