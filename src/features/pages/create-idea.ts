import { customElement, query, state } from 'lit/decorators.js';
import { css } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { parseUnits, toHex, trim } from 'viem';

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import type { SlInput, SlDialog } from '@shoelace-style/shoelace';

import '@layout/page-heading';
import '@components/common/label-with-hint';
import '@components/common/upd-dialog';
import '@components/common/share-dialog';
import '@components/common/transaction-watcher';
import { UpdDialog } from '@components/common/upd-dialog';
import { ShareDialog } from '@components/common/share-dialog';
import {
  TransactionWatcher,
  TransactionSuccess,
} from '@components/common/transaction-watcher';
import { SaveableForm, formToJson } from '@components/common/saveable-form';

import layout from '@state/layout';
import { getBalance, refreshBalances } from '@state/user/balances';
import { updraftSettings, defaultFunderReward } from '@state/common';
import { hasProfile, connectWallet } from '@state/user';

import { updraft } from '@contracts/updraft';
import { Upd } from '@contracts/upd';
import ideaSchema from '@schemas/idea-schema.json';

@customElement('create-idea')
export class CreateIdea extends SignalWatcher(SaveableForm) {
  @query('upd-dialog', true) updDialog!: UpdDialog;
  @query('share-dialog', true) shareDialog!: ShareDialog;
  @query('transaction-watcher.submit', true)
  submitTransaction!: TransactionWatcher;
  @query('transaction-watcher.approve', true)
  approveTransaction!: TransactionWatcher;
  @query('sl-dialog', true) approveDialog!: SlDialog;
  @query('sl-input[name="deposit"]', true) depositInput!: SlInput;

  @state() private depositError: string | null = null;
  @state() private antiSpamFee?: string;

  static styles = css`
    .container {
      display: flex;
      flex: auto; /* The container takes the remaining available space */
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

    .error {
      color: red;
      font-size: 0.8rem;
      padding-top: 0.25rem;
    }

    .submit-button {
      width: fit-content;
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
  `;

  private handleTagsInput(e: Event) {
    const input = e.target as SlInput;
    const value = input.value;
    const spacePositions =
      [...value.matchAll(/\s/g)].map((match) => match.index as number) || [];

    if (spacePositions.length > 4) {
      const fifthSpaceIndex = spacePositions[4];
      // Trim input to the fifth space and allow a trailing space
      input.value = value.slice(0, fifthSpaceIndex + 1);
      input.style.setProperty('--sl-input-focus-ring-color', 'red');
    } else {
      input.style.removeProperty('--sl-input-focus-ring-color');
    }
  }

  private handleDepositFocus() {
    refreshBalances();
  }

  private handleDepositInput(e: Event) {
    const input = e.target as SlInput;
    const value = Number(input.value);
    const userBalance = getBalance('updraft');
    const minFee = updraftSettings.get().minFee;

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
      fee = Math.max(minFee, value * updraftSettings.get().percentFee);
    }
    this.antiSpamFee = fee.toFixed(2);
  }

  private nextButtonClick(e: MouseEvent) {
    if (!this.form.checkValidity()) {
      e.preventDefault(); // If the form is invalid, prevent the click
      this.form.reportValidity(); // Show validation messages
    }
  }

  private handleFormSubmit(e: Event) {
    e.preventDefault(); // Prevent the default form submission when Enter is pressed
  }

  private async createIdea() {
    if (!this.form.checkValidity()) {
      this.form.reportValidity(); // Show validation messages
      return;
    }

    const ideaData = formToJson('create-idea', ideaSchema);
    const deposit = this.depositInput?.value;

    if (!deposit) {
      return;
    }

    try {
      this.submitTransaction.hash = await updraft.write('createIdea', [
        BigInt(defaultFunderReward.get()),
        parseUnits(deposit, 18),
        toHex(JSON.stringify(ideaData)),
      ]);
      this.shareDialog.topic = ideaData.name as string;
    } catch (e) {
      console.error('Idea creation error:', e);
      if (e instanceof Error) {
        if (
          e.message?.startsWith('connection') ||
          e.message?.includes('getChainId')
        ) {
          await connectWallet();
        } else if (e.message?.includes('exceeds balance')) {
          this.updDialog.show();
        } else if (
          e.message?.includes('exceeds allowance') &&
          updraftSettings.get().updAddress
        ) {
          this.approveTransaction.reset();
          this.approveDialog.show();
          const upd = new Upd(updraftSettings.get().updAddress!);
          this.approveTransaction.hash = await upd.write('approve', [
            updraft.address,
            parseUnits('1', 29), // approve for total supply of UPD
          ]);
        }
      }
    }
  }

  private async handleTransactionSuccess(t: TransactionSuccess) {
    const address = t.receipt?.logs?.[0]?.topics?.[1];
    if (address) {
      this.shareDialog.url = `${window.location.origin}/idea/${trim(address)}`;
      this.shareDialog.action = 'created an Idea';
      this.shareDialog.show();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    layout.topBarContent.set(html`
      <page-heading>Create a new Idea</page-heading>
    `);
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(false);
    layout.rightSidebarContent.set(html``);
  }

  render() {
    return html`
      <div class="container">
        <main>
          <form name="create-idea" @submit=${this.handleFormSubmit}>
            <sl-input name="name" required autocomplete="off">
              <label-with-hint
                slot="label"
                label="Name*"
                hint="A short name for your idea"
              ></label-with-hint>
            </sl-input>
            <sl-textarea name="description" resize="auto">
              <label-with-hint
                slot="label"
                label="Description"
                hint="How do you want to make your community, your project or the world better?"
              >
              </label-with-hint>
            </sl-textarea>
            <sl-input name="tags" @sl-input=${this.handleTagsInput}>
              <label-with-hint
                slot="label"
                label="Tags"
                hint="Enter up to five tags separated by spaces to help people find your idea.
                Use hyphens for multi-word-tags."
              >
              </label-with-hint>
            </sl-input>
            <div class="deposit-container">
              <label-with-hint
                label="Deposit*"
                hint="The initial UPD tokens you will deposit. The more you deposit, the more you stand
                to earn from supporters of your idea. As a creator, you can always withdraw your full
                initial deposit minus the anti-spam fee of 1 UPD or 1% (whichever is greater)."
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
            <input type="hidden" name="reward" value="50" />
            ${hasProfile.get()
              ? html` <sl-button
                  class="submit-button"
                  variant="primary"
                  @click=${this.createIdea}
                  >Create Idea
                </sl-button>`
              : html`<a href="/submit-profile-and-create-idea" rel="next">
                  <sl-button
                    class="submit-button"
                    variant="primary"
                    @click=${this.nextButtonClick}
                    >Next: Create your Profile
                  </sl-button>
                </a>`}
            <transaction-watcher
              class="submit"
              @transaction-success=${this.handleTransactionSuccess}
            ></transaction-watcher>
          </form>
          <upd-dialog></upd-dialog>
          <share-dialog></share-dialog>
          <transaction-watcher class="approve"></transaction-watcher>
          <sl-dialog label="Set Allowance">
            <p>
              Before you can create your idea, you need to sign a transaction to
              allow Updraft to spend your UPD tokens.
            </p>
            <transaction-watcher
              class="approve"
              @transaction-success=${() => {
                this.approveDialog.hide();
                this.createIdea();
              }}
            ></transaction-watcher>
          </sl-dialog>
        </main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'create-idea': CreateIdea;
  }
}
