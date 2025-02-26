import { customElement, query, state } from 'lit/decorators.js';
import { css, html } from 'lit';
import { consume } from '@lit/context';

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/range/range.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import type { SlInput, SlRange } from '@shoelace-style/shoelace';

import '@layout/top-bar'
import '@layout/page-heading'
import '@layout/left-side-bar'
import '@components/label-with-hint'
import '@components/upd-dialog';
import { UpdDialog } from '@components/upd-dialog';
import { SaveableForm } from '@components/base/saveable-form';

import { balanceContext, RequestBalanceRefresh, updraftSettings } from '@/context';
import { UpdraftSettings, Balances } from "@/types";

@customElement('create-idea')
export class CreateIdea extends SaveableForm {
  @query('sl-range', true) rewardRange!: SlRange;
  @query('upd-dialog', true) updDialog!: UpdDialog;

  @consume({ context: balanceContext, subscribe: true }) userBalances!: Balances;
  @consume({ context: updraftSettings, subscribe: true }) updraftSettings!: UpdraftSettings;

  @state() private depositError: string | null = null;
  @state() private antiSpamFee?: string;

  private resizeObserver!: ResizeObserver;

  static styles = css`
    left-side-bar {
      flex: 0 0 274px; /* Sidebar width is fixed */
    }

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

    sl-input[name="deposit"] {
      flex: none;
      width: calc(10ch + var(--sl-input-spacing-medium) * 2);
      box-sizing: content-box;
    }

    sl-input[name="deposit"]::part(input) {
      text-align: right;
    }

    sl-input[name="deposit"].invalid {
      --sl-input-focus-ring-color: red;
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

    .left-label, .right-label {
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
  `;

  private handleTagsInput(e: Event) {
    const input = e.target as SlInput;
    const value = input.value;
    const spacePositions = [...value.matchAll(/\s/g)].map(match => match.index) || [];

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
    this.dispatchEvent(new RequestBalanceRefresh());
  }

  private handleDepositInput(e: Event) {
    const input = e.target as SlInput;
    const value = Number(input.value);
    const userBalance = Number(this.userBalances?.updraft?.balance || 'Infinity');
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
        <page-heading>Create a new Idea</page-heading>
      </top-bar>
      <div class="container">
        <left-side-bar></left-side-bar>
        <main>
          <form name="create-idea" @submit=${this.handleFormSubmit}>
            <sl-input name="name" required autocomplete="off">
              <label-with-hint slot="label" label="Name*" hint="A short name for your idea"></label-with-hint>
            </sl-input>
            <sl-textarea name="description" resize="auto">
              <label-with-hint
                  slot="label"
                  label="Description"
                  hint="How do you want to make your community, your project or the world better?">
              </label-with-hint>
            </sl-textarea>
            <sl-input name="tags" @sl-input=${this.handleTagsInput}>
              <label-with-hint
                  slot="label"
                  label="Tags"
                  hint="Enter up to five tags separated by spaces to help people find your idea. \
                   Use hyphens for multi-word-tags.">
              </label-with-hint>
            </sl-input>
            <div class="deposit-container">
              <label-with-hint
                  label="Deposit*"
                  hint="The initial UPD tokens you will deposit. The more you deposit, the more you \
                        stand to earn from supporters of your idea. As a creator, you can always withdraw your \
                        full initial deposit minus the anti-spam fee of 1 UPD or 1% (whichever is greater).">
              </label-with-hint>
              <div class="deposit-row">
                <sl-input
                    name="deposit"
                    required
                    autocomplete="off"
                    @focus=${this.handleDepositFocus}
                    @input=${this.handleDepositInput}>
                </sl-input>
                <span>UPD</span>
                <sl-button
                    variant="primary"
                    @click=${() => this.updDialog.show()}>Get more UPD
                </sl-button>
                ${this.antiSpamFee ? html`<span>Anti-Spam Fee: ${this.antiSpamFee} UPD</span>` : ''}
              </div>
              ${this.depositError ? html`<div class="error">${this.depositError}</div>` : ''}
            </div>
            <div class="reward-container">
              <label-with-hint
                  label="Funder Reward"
                  hint="The % of each contribution that goes to funder rewards. A high funder reward means supporters \
                        stand to earn more if your idea is popular. A low funder reward means more of their funds are \
                        available to withdraw if your idea isn’t popular.">
              </label-with-hint>
              <div class="range-and-labels">
                <span class="left-label">Risk less</span>
                <sl-range name="reward" value="50"></sl-range>
                <span class="right-label">Earn more</span>
              </div>
            </div>
            <a href="/submit-profile-and-create-idea" rel="next">
              <sl-button variant="primary" @click=${this.nextButtonClick}>Next: Create your Profile</sl-button>
            </a>
          </form>
          <upd-dialog></upd-dialog>
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