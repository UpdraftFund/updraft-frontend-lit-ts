import { customElement, property, query, state } from 'lit/decorators.js';
import { css } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { Subscription } from 'wonka';
import { parseUnits, toHex, trim } from 'viem';
import dayjs from 'dayjs';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/range/range.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import type {
  SlDialog,
  SlInput,
  SlRange,
  SlSelect,
} from '@shoelace-style/shoelace';

// Components
import '@layout/page-heading';
import '@components/common/token-input';
import '@components/common/transaction-watcher';
import '@components/common/upd-dialog';
import '@components/common/share-dialog';
import '@components/common/label-with-hint';
import {
  SaveableForm,
  formToJson,
  loadForm,
} from '@components/common/saveable-form';
import {
  TransactionWatcher,
  TransactionSuccess,
} from '@components/common/transaction-watcher';
import { ShareDialog } from '@components/common/share-dialog';
import { UpdDialog } from '@components/common/upd-dialog';
import { ITokenInput } from '@components/common/token-input';

// Styles
import { dialogStyles } from '@styles/dialog-styles';

// Utils
import { createSolutionHeading } from '@utils/create-solution/create-solution-heading';
import { modal } from '@utils/web3';
import { ethAddressPattern } from '@utils/format-utils';

// State
import { updraftSettings } from '@state/common';
import layout from '@state/layout';
import { hasProfile } from '@state/user';

// Contracts
import { updraft } from '@contracts/updraft';

// Schemas
import solutionSchema from '@schemas/solution-schema.json';

@customElement('create-solution-page-two')
export class CreateSolution extends SignalWatcher(SaveableForm) {
  @property() ideaId!: string;

  @query('sl-range', true) rewardRange!: SlRange;
  @query('upd-dialog', true) updDialog!: UpdDialog;
  @query('transaction-watcher.submit', true)
  submitTransaction!: TransactionWatcher;
  @query('transaction-watcher.approve', true)
  approveTransaction!: TransactionWatcher;
  @query('share-dialog', true) shareDialog!: ShareDialog;
  @query('sl-dialog', true) approveDialog!: SlDialog;
  @query('sl-input[name="fundingToken"]', true)
  fundingTokenInput!: SlInput;
  @query('sl-select[name="fundingTokenSelection"]', true)
  fundingTokenSelect!: SlSelect;
  @query('token-input', true) tokenInput!: ITokenInput;

  @state() private showCustomTokenInput = false;

  private resizeObserver!: ResizeObserver;
  private unsubHeading?: Subscription;

  static styles = [
    dialogStyles,
    css`
      :host {
        width: 100%;
        overflow: hidden;
      }

      h2 {
        margin: 0 0 0.5rem;
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
        transform: translateX(0.25rem);
      }

      .reward-container sl-range::part(tooltip)::after {
        /* Hide the tooltip arrow */
        display: none;
        visibility: hidden;
      }

      /* Keep the calendar control close to the date */
      sl-input[name='deadline']::part(form-control-input) {
        box-sizing: content-box;
        max-width: calc(16ch + var(--sl-input-spacing-medium) * 2);
      }

      .hidden {
        display: none;
      }

      .button-container {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
      }

      /* Responsive behavior for smaller screens */
      @media (max-width: 768px) {
        form {
          margin: 1rem;
        }
      }
    `,
  ];

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

  private setDefaultFundingToken() {
    // After loading the saved form values, if no funding token is chosen,
    // select the default value.
    if (this.fundingTokenInput.value) {
      if (this.fundingTokenSelect.value === 'custom') {
        this.showCustomTokenInput = true;
      } else {
        this.fundingTokenSelect.value = this.fundingTokenInput.value;
      }
    } else {
      const updraftAddress = updraftSettings.get().updAddress;
      if (updraftAddress) {
        this.fundingTokenSelect.value = updraftAddress;
        this.fundingTokenInput.value = updraftAddress;
      }
    }
  }

  private handleTokenSelection() {
    if (this.fundingTokenSelect.value === 'custom') {
      this.showCustomTokenInput = true;
      this.fundingTokenInput.value = '';
    } else {
      this.showCustomTokenInput = false;
      this.fundingTokenInput.value = this.fundingTokenSelect.value as string;
    }
  }

  private handleCustomTokenInput(e: Event) {
    const input = e.target as SlInput;

    if (input.value === '' || ethAddressPattern.test(input.value)) {
      input.style.removeProperty('--sl-input-focus-ring-color');
    } else {
      input.style.setProperty('--sl-input-focus-ring-color', 'red');
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

  private nextButtonClick(e: MouseEvent) {
    const form = this.form;
    if (!form.checkValidity()) {
      e.preventDefault(); // If the form is invalid, prevent the click
      form.reportValidity(); // Show validation messages
      return;
    }
  }

  private async createSolution() {
    if (!this.form.checkValidity()) {
      this.form.reportValidity(); // Show validation messages
      return;
    }

    // Get solution data from the first form
    const solutionData = formToJson('create-solution', solutionSchema);

    // Check if we have the required solution data
    if (!solutionData.name || !solutionData.description) {
      console.error('Missing required solution data');
      return;
    }

    // Get funding details from the current form
    const solutionForm = loadForm('create-solution-two');
    if (!solutionForm) {
      console.error('Could not load solution form data');
      return;
    }

    const { ideaId, fundingToken, goal, deadline, stake, reward } =
      solutionForm;

    try {
      const settings = updraftSettings.get();
      // Format the deadline date properly
      const deadlineTimestamp = dayjs(deadline).unix();

      this.submitTransaction.hash = await updraft.write('createSolution', [
        ideaId,
        fundingToken,
        stake ? parseUnits(stake, 18) : BigInt(0),
        parseUnits(goal, 18),
        BigInt(deadlineTimestamp),
        BigInt((Number(reward) * Number(settings.percentScale)) / 100),
        toHex(JSON.stringify(solutionData)),
      ]);
      this.shareDialog.topic = solutionData.name as string;
    } catch (e) {
      // Use token-input's error handling
      if (this.tokenInput) {
        this.tokenInput.handleTransactionError(
          e,
          () => this.createSolution(), // Retry after approval
          () => this.updDialog.show() // Show UPD dialog on low balance
        );
      } else {
        console.error('Transaction error:', e);
        if (e instanceof Error && e.message.startsWith('connection')) {
          modal.open({ view: 'Connect' });
        }
      }
    }
  }

  private async handleTransactionSuccess(t: TransactionSuccess) {
    const address = t.receipt?.logs?.[1]?.topics?.[1];
    const ideaId = t.receipt?.logs?.[1]?.topics?.[3];
    if (address && ideaId) {
      this.shareDialog.url = `${window.location.origin}/solution/${trim(address)}`;
      this.shareDialog.action = 'created a Solution';
      this.shareDialog.show();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(false);
    layout.rightSidebarContent.set(html``);
    this.unsubHeading = createSolutionHeading(this.ideaId);
  }

  firstUpdated(changedProperties: Map<string | number | symbol, unknown>) {
    super.firstUpdated(changedProperties);

    this.rewardRange.tooltipFormatter = (value: number) => `${value}%`;
    this.rewardRange.defaultValue = 25;
    this.rewardRange.max = 80;

    // Set the slider value to 25 only if there's no saved form value
    const savedForm = loadForm('create-solution-two');
    if (!savedForm || !savedForm.reward) {
      this.rewardRange.value = 25;
    }

    this.rewardRange.updateComplete.then(this.syncRangeTooltip);

    this.resizeObserver = new ResizeObserver(this.syncRangeTooltip);
    this.resizeObserver.observe(this.rewardRange);

    this.updateComplete.then(() => {
      this.setDefaultFundingToken();
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubHeading) {
      this.unsubHeading.unsubscribe();
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  render() {
    const updAddress = updraftSettings.get().updAddress;
    return html`
      <form name="create-solution-two" @submit=${this.handleFormSubmit}>
        <h2>Funding details</h2>

        <input type="hidden" name="ideaId" value="${this.ideaId}" />

        <sl-select
          name="fundingTokenSelection"
          @sl-change=${this.handleTokenSelection}
        >
          <label-with-hint
            slot="label"
            label="Funding Token*"
            hint="The token you want to use to fund your solution"
          ></label-with-hint>
          <sl-option value="${updAddress}">UPD</sl-option>
          <sl-option value="custom">Custom Token Address</sl-option>
        </sl-select>

        <sl-input
          name="fundingToken"
          class=${this.showCustomTokenInput ? '' : 'hidden'}
          pattern=${ethAddressPattern.source}
          required
          placeholder="0x..."
          @input=${this.handleCustomTokenInput}
        >
          <label-with-hint
            slot="label"
            label="Custom Token Address*"
            hint="Enter the address of the token you want to use"
          ></label-with-hint>
        </sl-input>

        <sl-input
          name="goal"
          required
          autocomplete="off"
          @input=${this.handleGoalInput}
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
            hint="The date by which your funding goal should be reached"
          ></label-with-hint>
        </sl-input>

        <div class="deposit-container">
          <label-with-hint
            label="Stake"
            hint="Add a stake to attract more funders. If don't reach your
                funding goal, this amount will be distributed to your funders."
          >
          </label-with-hint>
          <div class="deposit-row">
            <token-input
              name="stake"
              spendingContract=${updraft.address}
              spendingContractName="Updraft"
              antiSpamFeeMode="fixed"
              showDialogs="false"
            >
              <sl-button
                slot="invalid"
                variant="primary"
                @click=${() => this.updDialog.show()}
              >
                Get more UPD
              </sl-button>
            </token-input>
          </div>
        </div>
        <div class="reward-container">
          <label-with-hint
            label="Funder Reward"
            hint="Allow funders to earn a % of the funds contributed by later funders.
            A higher reward lets funders earn more but adds less to the solution fund."
          >
          </label-with-hint>
          <div class="range-and-labels">
            <span class="left-label">More for solution</span>
            <sl-range name="reward"></sl-range>
            <span class="right-label">More for funders</span>
          </div>
        </div>
        <span class="button-container">
          <sl-button href="/create-solution/${this.ideaId}" variant="primary"
            >Previous
          </sl-button>
          ${hasProfile.get()
            ? html` <sl-button variant="primary" @click=${this.createSolution}
                >Create Solution
              </sl-button>`
            : html` <sl-button
                href="/submit-profile-and-create-solution"
                variant="primary"
                @click=${this.nextButtonClick}
                >Next: Create your Profile
              </sl-button>`}
        </span>
        <transaction-watcher
          class="submit"
          @transaction-success=${this.handleTransactionSuccess}
        ></transaction-watcher>
      </form>
      <upd-dialog></upd-dialog>
      <share-dialog></share-dialog>
      <sl-dialog label="Set Allowance">
        <p>
          Before you can create your solution, you need to sign a transaction to
          allow Updraft to spend your UPD tokens.
        </p>
        <transaction-watcher
          class="approve"
          @transaction-success=${() => {
            this.approveDialog.hide();
            this.createSolution();
          }}
        ></transaction-watcher>
      </sl-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'create-solution-page-two': CreateSolution;
  }
}
