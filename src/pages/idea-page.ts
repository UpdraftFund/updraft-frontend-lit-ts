import { customElement, property, query, state } from 'lit/decorators.js';
import { html, css, LitElement } from 'lit';
import { consume } from "@lit/context";
import { Task } from '@lit/task';
import { fromHex, formatUnits, parseUnits } from "viem";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(relativeTime);
dayjs.extend(utc);

import gift from '@icons/gift.svg';
import fire from '@icons/fire.svg';

import { dialogStyles } from "@styles/dialog-styles";

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { SlDialog, SlInput } from "@shoelace-style/shoelace";

import '@layout/top-bar';
import '@layout/left-side-bar';
import '@components/page-specific/idea-side-bar';
import '@components/upd-dialog';
import '@components/share-dialog';
import '@components/transaction-watcher';
import { UpdDialog } from "@components/upd-dialog.ts";
import { ShareDialog } from "@components/share-dialog.ts";
import { TransactionWatcher } from "@components/transaction-watcher.ts";

import urqlClient from '@/urql-client';
import { IdeaDocument } from '@gql';
import { IdeaContract } from '@contracts/idea';
import { Upd } from "@contracts/upd";
import { balanceContext, RequestBalanceRefresh, updraftSettings } from '@/context';
import { UpdraftSettings, Balances, Idea } from "@/types";
import { modal } from "@/web3.ts";
import { shortNum } from "@/utils.ts";

@customElement('idea-page')
export class IdeaPage extends LitElement {
  static styles = [
    dialogStyles,
    css`
      .container {
        display: flex;
        flex: 1 1 auto;
        overflow: hidden;
      }

      left-side-bar {
        flex: 0 0 274px;
      }

      idea-side-bar {
        flex: 0 0 300px;
      }

      main {
        flex: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: .2rem;
        padding: .5rem 1rem;
        color: var(--main-foreground);
        background: var(--main-background);
      }

      .support {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 0.25rem;
      }

      .support sl-input {
        flex: 0 0 auto;
        width: calc(10ch + var(--sl-input-spacing-medium) * 2);
        box-sizing: content-box;
      }

      .support sl-input::part(input) {
        text-align: right;
      }

      sl-input[name="support"].invalid {
        --sl-input-focus-ring-color: red;
      }

      .error {
        color: red;
        font-size: 0.8rem;
        padding-top: 0.25rem;
      }

      .heading {
        font-size: 1.9rem;
        font-weight: 500;
        margin-bottom: 0;
      }

      .created {
        font-size: 0.9rem;
        margin-top: 0.4rem;
      }
      
      .reward-fire {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 1rem 0;
      }
      
      .reward-fire span {
        display: flex;
        gap: .3rem;
      }
      
      .reward sl-icon{
        padding-top: 2px; // align the box part of the gift with the text
      }
      
      .fire {
        align-items: center;
      }

      .description {
        font-size: 1rem;
        margin-bottom: 1rem;
      }

      .tags {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .tag {
        background: var(--sl-color-neutral-100);
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.875rem;
        color: var(--sl-color-neutral-700);
      }

      sl-dialog::part(body) {
        padding-top: 0;
      }

      @media (max-width: 1415px) {
        left-side-bar {
          flex: 0 0 0;
          pointer-events: none;
        }
      }

      @media (max-width: 1130px) {
        idea-side-bar {
          flex: 0 0 0;
          pointer-events: none;
        }
      }
    `];

  @query('form', true) form!: HTMLFormElement;
  @query('share-dialog', true) shareDialog!: ShareDialog;
  @query('upd-dialog', true) updDialog!: UpdDialog;
  @query('transaction-watcher.submit', true) submitTransaction!: TransactionWatcher;
  @query('transaction-watcher.approve', true) approveTransaction!: TransactionWatcher;
  @query('sl-dialog', true) approveDialog!: SlDialog;

  @state() private depositError: string | null = null;
  @state() private antiSpamFee: string = '1'; // 1 UPD
  @state() private needUpd: boolean = false;

  @consume({ context: balanceContext, subscribe: true }) userBalances!: Balances;
  @consume({ context: updraftSettings, subscribe: true }) updraftSettings!: UpdraftSettings;

  @property() ideaId!: `0x${string}`;
  //TODO: each url should include a network
  //@property() network!: string;

  private minFee = 1; // 1 UPD
  private percentFee = 1; // 1%

  private readonly idea = new Task(this, {
    task: async ([ideaId]) => {
      const result = await urqlClient.query(IdeaDocument, { ideaId });
      const ideaData = result.data?.idea;
      const ideaContract = new IdeaContract(ideaId);
      const percentScaleBigInt = await ideaContract.read('percentScale') as bigint;
      const percentScale = Number(percentScaleBigInt);
      const percentFee = await ideaContract.read('percentFee') as bigint;
      const minFee = await ideaContract.read('minFee') as bigint;
      this.percentFee = Number(percentFee) / percentScale;
      this.minFee = Number(formatUnits(minFee, 18));
      if (ideaData) {
        ideaData.funderReward = Number(ideaData.funderReward) / percentScale;
        return ideaData as Idea;
      } else {
        throw new Error(`Idea ${ideaId} not found.`);
      }
    },
    args: () => [this.ideaId] as const
  });

  private handleSupportFocus() {
    this.dispatchEvent(new RequestBalanceRefresh());
  }

  private handleSupportInput(e: Event) {
    const input = e.target as SlInput;
    const value = Number(input.value);
    const userBalance = Number(this.userBalances?.updraft?.balance || 'Infinity');
    this.needUpd = false;

    if (isNaN(value)) {
      this.depositError = 'Enter a number';
    } else if (value <= this.minFee) {
      this.depositError = `Deposit must be more than ${this.minFee} UPD to cover fees`;
    } else if (value > userBalance) {
      this.depositError = `You have ${userBalance} UPD`;
      this.needUpd = true;
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
      fee = this.minFee;
    } else {
      fee = Math.max(this.minFee, value * this.percentFee);
    }
    this.antiSpamFee = fee.toFixed(2);
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();
    if (this.form.checkValidity()) {
      const formData = new FormData(this.form);
      const support = parseUnits(formData.get('support') as string, 18);
      const total = support + parseUnits(this.antiSpamFee, 18);
      try {
        const idea = new IdeaContract(this.ideaId);
        this.submitTransaction.hash = await idea.write('contribute', [support]);
      } catch (e: any) {
        if (e.message.startsWith('connection')) {
          modal.open({ view: "Connect" });
        } else if (e.message.includes('exceeds balance')) {
          this.updDialog.show();
        } else if (e.message.includes('exceeds allowance')) {
          this.approveTransaction.reset();
          this.approveDialog.show();
          const upd = new Upd(this.updraftSettings.updAddress);
          this.approveTransaction.hash = await upd.write('approve', [this.ideaId, total]);
        }
        console.error(e);
      }
    } else {
      this.form.reportValidity(); // Show validation messages
    }
  }

  private async handleTransactionSuccess() {
    this.shareDialog.url = `${window.location.origin}/idea/${this.ideaId}`;
    this.shareDialog.action = 'supported an Idea';
    this.approveDialog.hide();
    this.shareDialog.show();
  }

  render() {
    return html`
      <top-bar></top-bar>
      <div class="container">
        <left-side-bar></left-side-bar>
        <main>
          ${this.idea.render({
            complete: (idea: Idea) => {
              const { startTime, funderReward, shares, creator, tags, description } = idea;
              const profile = JSON.parse(fromHex(creator.profile as `0x${string}`, 'string'));
              const date = dayjs(startTime * 1000);
              const interest = shortNum(formatUnits(shares, 18));
              return html`
                <h1 class="heading">Idea: ${idea.name}</h1>
                <a href="/profile/${creator.id}">by ${profile.name || creator.id}</a>
                <span class="created">Created ${date.format('MMM D, YYYY [at] h:mm A UTC')} (${date.fromNow()})</span>
                <div class="reward-fire">
                  <span class="reward"><sl-icon src=${gift}></sl-icon>${funderReward * 100}% funder reward</span>
                  <span class="fire"><sl-icon src=${fire}></sl-icon>${interest}</span>
                </div>
                <form @submit=${this.handleSubmit}>
                  <div class="support">
                    <sl-input
                        name="support"
                        required
                        autocomplete="off"
                        @focus=${this.handleSupportFocus}
                        @input=${this.handleSupportInput}>
                    </sl-input>
                    <span>UPD</span>
                    ${this.needUpd ? html`
                      <sl-button
                          variant="primary"
                          @click=${() => this.updDialog.show()}>Get more UPD
                      </sl-button>
                    ` : html`
                      <sl-button variant="primary" type="submit">
                        Support this Idea
                      </sl-button>
                    `}
                    ${this.antiSpamFee ? html`<span>Anti-Spam Fee: ${this.antiSpamFee} UPD</span>` : ''}
                  </div>
                  ${this.depositError ? html`
                    <div class="error">${this.depositError}</div>` : ''}
                </form>
                <p>${description}</p>
                ${tags ? html`
                  <div class="tags">
                    ${tags.map((tag) => html`<span class="tag">${tag}</span>`)}
                  </div>
                ` : ''}
                <share-dialog .topic=${idea.name}></share-dialog>
              `
            }
          })}
          <upd-dialog></upd-dialog>
          <sl-dialog label="Set Allowance">
            <p>Before you can support this Idea,
              you need to sign a transaction to allow the Idea contract to spend your UPD tokens.</p>
            <transaction-watcher class="approve" @transaction-success=${this.handleSubmit}></transaction-watcher>
          </sl-dialog>
          <transaction-watcher class="submit" @transaction-success=${this.handleTransactionSuccess}>
          </transaction-watcher>
        </main>
        <idea-side-bar></idea-side-bar>
      </div>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'idea-page': IdeaPage;
  }
}
