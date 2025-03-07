import {
  formToJson,
  loadForm,
  SaveableForm,
} from '@/components/base/saveable-form';
import { customElement, property, query, state } from 'lit/decorators.js';
import { html, css } from 'lit';
import { parseUnits, toHex } from 'viem';
import dayjs from 'dayjs';
import { TaskStatus } from '@lit/task';

import {
  balanceContext,
  RequestBalanceRefresh,
  updraftSettings,
} from '@/context';
import { consume } from '@lit/context';

import {
  TransactionSuccess,
  TransactionWatcher,
} from '@/components/transaction-watcher';
import { ShareDialog } from '@/components/share-dialog';
import { UpdDialog } from '@components/upd-dialog';

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/range/range.js';

import type { SlDialog, SlInput, SlRange } from '@shoelace-style/shoelace';
import { dialogStyles } from '@/styles/dialog-styles';

import '@layout/top-bar';
import '@layout/page-heading';
import '@layout/left-side-bar';
import '@layout/activity-feed';
import '@components/transaction-watcher';
import '@components/upd-dialog';
import '@components/share-dialog';
import '@components/label-with-hint';

import solutionSchema from '@schemas/solution-schema.json';
import { updraft } from '@/contracts/updraft';
import { Upd } from '@/contracts/upd';

import { UpdraftSettings } from '@/types';
import { Balances } from '@/types';
import { modal } from '@/web3';

@customElement('create-solution')
export class CreateSolution extends SaveableForm {
  @property({ type: String }) ideaId!: string;

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
  @consume({ context: updraftSettings, subscribe: true })
  updraftSettings!: UpdraftSettings;

  @state() private depositError: string | null = null;
  @state() private antiSpamFee?: string;

  private resizeObserver!: ResizeObserver;

  static styles = [
    dialogStyles,
    css`
      left-side-bar {
        flex: 0 0 274px;
      }

      .container {
        display: flex;
        flex: auto;
        overflow: hidden;
      }

      main {
        flex: 1;
        box-sizing: border-box;
      }

      .idea-name {
        font-size: 1.5rem;
        font-weight: 600;
        margin: 1.5rem 3rem;
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
        left-side-bar {
          flex: 0 0 0;
          pointer-events: none;
          padding: 0;
          border: none;
        }

        .container {
          flex-direction: column;
        }

        form {
          margin: 1rem;
        }
      }

      @media (max-width: 1078px) {
        activity-feed {
          flex: 0 0 0; /* Collapse the sidebar */
          pointer-events: none; /* Prevent interaction when hidden */
        }
      }
    `,
  ];

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

  private syncRangeTooltip = () => {
    // Hack to sync the tooltip
    this.rewardRange.focus();
    this.rewardRange.syncRange();
    this.rewardRange.blur();
  };

  private handleFormSubmit(e: Event) {
    e.preventDefault(); // Prevent the default form submission when Enter is pressed
  }

  private async handleSubmit() {
    if (this.submitTransaction.transactionTask.status !== TaskStatus.PENDING) {
      try {
        const solution = formToJson('create-solution', solutionSchema);
        const solutionForm = loadForm('create-solution');
        if (solutionForm) {
          this.submitTransaction.hash = await updraft.write('createSolution', [
            this.ideaId,
            solutionForm['funding-token'],
            parseUnits(solutionForm['deposit'], 18),
            parseUnits(solutionForm['goal'], 18),
            dayjs(solutionForm['deadline']).unix(),
            BigInt(
              (Number(solutionForm['reward']) *
                this.updraftSettings.percentScale) /
                100
            ),
            toHex(JSON.stringify(solution)),
          ]);
          this.shareDialog.topic = solution.name as string;
        }
      } catch (e: any) {
        if (e.message.startsWith('connection')) {
          modal.open({ view: 'Connect' });
        } else if (e.message.includes('exceeds balance')) {
          this.updDialog.show();
        } else if (e.message.includes('exceeds allowance')) {
          this.approveTransaction.reset();
          this.approveDialog.show();
          const upd = new Upd(this.updraftSettings.updAddress);
          this.approveTransaction.hash = await upd.write('approve', [
            updraft.address,
            parseUnits('1', 29),
          ]);
        }
        console.error(e);
      }
    }
  }

  private async handleSubmitSuccess(t: TransactionSuccess) {
    console.log('submit success', t);
  }

  firstUpdated(changedProperties: Map<string | number | symbol, unknown>) {
    super.firstUpdated(changedProperties);

    this.rewardRange.tooltipFormatter = (n: number) => `${n}%`;
    this.rewardRange.defaultValue = 50;
    this.rewardRange.updateComplete.then(this.syncRangeTooltip);

    this.resizeObserver = new ResizeObserver(this.syncRangeTooltip);
    this.resizeObserver.observe(this.rewardRange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.resizeObserver?.disconnect();
  }

  render() {
    return html`
      <top-bar hide-create-idea-button>
        <page-heading>Create a new Solution</page-heading>
      </top-bar>
      <div class="container">
        <left-side-bar></left-side-bar>
        <main>
          <h1 class="idea-name">Idea: ${this.ideaId}</h1>
          <form name="create-solution" @submit=${this.handleFormSubmit}>
            <sl-input name="name" required autocomplete="off">
              <label-with-hint
                slot="label"
                label="Name*"
                hint="A short name for your solution"
              ></label-with-hint>
            </sl-input>

            <sl-textarea name="description" resize="auto">
              <label-with-hint
                slot="label"
                label="Description"
                hint="A description of your solution"
              ></label-with-hint>
            </sl-textarea>

            <sl-input name="funding-token" required autocomplete="off">
              <label-with-hint
                slot="label"
                label="Funding Token*"
                hint="The address of the token you want to use to fund your solution"
              ></label-with-hint>
            </sl-input>

            <div class="deposit-container">
              <label-with-hint
                label="Deposit*"
                hint="The initial UPD tokens you will deposit. The more you deposit, the more you                         stand to earn from supporters of your idea. As a creator, you can always withdraw your                         full initial deposit minus the anti-spam fee of 1 UPD or 1% (whichever is greater)."
              >
              </label-with-hint>
              <div class="deposit-row">
                <sl-input
                  name="deposit"
                  required
                  autocomplete="off"
                  @focus=${this.handleDepositFocus}
                  @input=${this.handleDepositInput}
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

            <sl-input name="goal" required autocomplete="off">
              <label-with-hint
                slot="label"
                label="Goal*"
                hint="The amount of funding you want to raise"
              ></label-with-hint>
            </sl-input>

            <sl-input name="deadline" required autocomplete="off">
              <label-with-hint
                slot="label"
                label="Deadline*"
                hint="The deadline for your solution Format: YYYY-MM-DDTHH:MM:SS.000+00:00 Example: 2025-03-01T00:00:00.000+00:00"
              ></label-with-hint>
            </sl-input>

            <div class="reward-container">
              <label-with-hint
                label="Contributor Fee"
                hint="The % of each contribution that goes to contributors. A high contributor fee means contributors                         stand to earn more if your solution is popular. A low contributor fee means more of their funds are                         available to withdraw if your solution isn’t popular."
              >
              </label-with-hint>
              <div class="range-and-labels">
                <span class="left-label">Risk less</span>
                <sl-range name="reward" value="50"></sl-range>
                <span class="right-label">Earn more</span>
              </div>
            </div>

            <sl-button variant="primary" @click=${this.handleSubmit}
              >Submit Solution</sl-button
            >
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
        <activity-feed></activity-feed>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'create-solution': CreateSolution;
  }
}
