import { customElement, property, query, state } from 'lit/decorators.js';
import { html, css, LitElement } from 'lit';
import { consume } from '@lit/context';
import { cache } from 'lit/directives/cache.js';

import { fromHex, formatUnits, parseUnits } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(relativeTime);
dayjs.extend(utc);

import gift from '@icons/common/gift.svg';
import fire from '@icons/idea/fire.svg';

import { dialogStyles } from '@/features/common/styles/dialog-styles';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { SlDialog, SlInput } from '@shoelace-style/shoelace';

import '@components/navigation/create-idea-button';
import '@/features/common/components/upd-dialog';
import '@/features/common/components/share-dialog';
import '@/features/common/components/transaction-watcher';
import { UpdDialog } from '@/features/common/components/upd-dialog';
import { ShareDialog } from '@/features/common/components/share-dialog';
import { TransactionWatcher } from '@/features/common/components/transaction-watcher';

import urqlClient from '@utils/urql-client';
import { IdeaDocument } from '@gql';
import { IdeaContract } from '@contracts/idea';
import { Upd } from '@contracts/upd';
import {
  balanceContext,
  defaultFunderReward,
  RequestBalanceRefresh,
  updraftSettings,
} from '@state/common';
import { UpdraftSettings, Balances, Idea } from '@/types';
import { modal } from '@utils/web3';
import { shortNum } from '@utils/short-num';
import layout from '@state/layout';

@customElement('idea-page')
export class IdeaPage extends LitElement {
  static styles = [
    dialogStyles,
    css`
      main {
        flex: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        padding: 0.5rem 1rem;
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
        flex: none;
        width: calc(10ch + var(--sl-input-spacing-medium) * 2);
        box-sizing: content-box;
      }

      .support sl-input::part(input) {
        text-align: right;
      }

      sl-input[name='support'].invalid {
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
        gap: 0.3rem;
      }

      .reward sl-icon {
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
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .tag {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background-color: var(--subtle-background);
        border-radius: 1rem;
        font-size: 0.875rem;
        text-decoration: none;
        color: var(--main-foreground);
      }

      .tag:hover {
        background-color: var(--accent);
        color: var(--sl-color-neutral-0);
      }

      .error-container {
        display: flex;
        flex-direction: column;
        padding: 2rem;
        gap: 1rem;
      }

      .error-container h2 {
        color: var(--sl-color-danger-600);
        margin: 0;
      }

      .error-container p {
        max-width: 500px;
      }

      sl-button {
        max-width: fit-content;
      }

      sl-dialog::part(body) {
        padding-top: 0;
      }
    `,
  ];

  @query('form', true) form!: HTMLFormElement;
  @query('share-dialog', true) shareDialog!: ShareDialog;
  @query('upd-dialog', true) updDialog!: UpdDialog;
  @query('transaction-watcher.submit', true)
  submitTransaction!: TransactionWatcher;
  @query('transaction-watcher.approve', true)
  approveTransaction!: TransactionWatcher;
  @query('sl-dialog', true) approveDialog!: SlDialog;

  @state() private depositError: string | null = null;
  @state() private antiSpamFee: string = '1'; // 1 UPD
  @state() private needUpd: boolean = false;
  @state() private idea?: Idea; // the fetched idea
  @state() private error: string | null = null;
  @state() private loaded: boolean = false;

  @consume({ context: balanceContext, subscribe: true })
  userBalances!: Balances;
  @consume({ context: updraftSettings, subscribe: true })
  updraftSettings!: UpdraftSettings;

  @property() ideaId!: `0x${string}`;
  //TODO: each url should include a network
  //@property() network!: string;

  private unsubIdea?: () => void;

  private subscribe() {
    // Clean up any existing subscription
    this.unsubIdea?.();

    if (this.ideaId) {
      this.loaded = false;
      this.error = null;
      const ideaSub = urqlClient
        .query(IdeaDocument, { ideaId: this.ideaId })
        .subscribe((result) => {
          this.loaded = true;
          this.idea = result.data?.idea as Idea;
          if (this.idea) {
            layout.rightSidebarContent.set(html`
              <top-supporters .ideaId=${this.ideaId}></top-supporters>
              <related-ideas
                .ideaId=${this.ideaId}
                .tags=${this.idea.tags}
              ></related-ideas>
            `);
          }
          if (result.error) {
            this.error = result.error.message;
          }
        });
      this.unsubIdea = ideaSub.unsubscribe;
    }
  }

  private handleVisibilityChange = () => {
    // Pause subscription when tab is hidden
    if (document.hidden) {
      this.unsubIdea?.();
    } else {
      this.subscribe();
    }
  };

  private handleSupportFocus() {
    this.dispatchEvent(new RequestBalanceRefresh());
  }

  private handleSupportInput(e: Event) {
    const input = e.target as SlInput;
    const value = Number(input.value);
    const userBalance = Number(
      this.userBalances?.updraft?.balance || 'Infinity'
    );
    this.needUpd = false;

    if (isNaN(value)) {
      this.depositError = 'Enter a number';
    } else if (value <= this.updraftSettings.minFee) {
      this.depositError = `Deposit must be more than ${this.updraftSettings.minFee} UPD to cover fees`;
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
      fee = this.updraftSettings.minFee;
    } else {
      fee = Math.max(
        this.updraftSettings.minFee,
        value * this.updraftSettings.percentFee
      );
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
      } catch (e) {
        if (e instanceof Error) {
          if (e.message.startsWith('connection')) {
            modal.open({ view: 'Connect' });
          } else if (e.message.includes('exceeds balance')) {
            this.updDialog.show();
          } else if (e.message.includes('exceeds allowance')) {
            this.approveTransaction.reset();
            this.approveDialog.show();
            const upd = new Upd(this.updraftSettings.updAddress);
            this.approveTransaction.hash = await upd.write('approve', [
              this.ideaId,
              total,
            ]);
          }
        }
        console.error(e);
      }
    } else {
      this.form.reportValidity(); // Show validation messages
    }
  }

  private async handleTransactionSuccess() {
    this.shareDialog.url = `${window.location.origin}/idea/${this.ideaId}`;
    this.approveDialog.hide();
    this.shareDialog.show();
  }

  private renderIdea() {
    if (this.idea) {
      const {
        startTime,
        funderReward,
        shares,
        creator,
        tags,
        description,
        name,
      } = this.idea;

      let pctFunderReward;
      if (funderReward != defaultFunderReward && this.updraftSettings) {
        pctFunderReward =
          (funderReward * 100) / this.updraftSettings.percentScale;
      }

      const profile = JSON.parse(
        fromHex(creator.profile as `0x${string}`, 'string')
      );
      const date = dayjs(startTime * 1000);
      const interest = shortNum(formatUnits(shares, 18));

      return html`
        <h1 class="heading">Idea: ${name}</h1>
        <a href="/profile/${creator.id}">by ${profile.name || creator.id}</a>
        <span class="created">
          Created ${date.format('MMM D, YYYY [at] h:mm A UTC')}
          (${date.fromNow()})
        </span>
        <div class="reward-fire">
          <!--          TODO: don't show funder reward if it's the default value-->
          ${pctFunderReward
            ? html`
                <span class="reward">
                  <sl-icon src=${gift}></sl-icon>
                  ${pctFunderReward.toFixed(0)}% funder reward
                </span>
              `
            : html``}
          <span class="fire"> <sl-icon src=${fire}></sl-icon>${interest} </span>
        </div>
        <form @submit=${this.handleSubmit}>
          <div class="support">
            <sl-input
              name="support"
              required
              autocomplete="off"
              @focus=${this.handleSupportFocus}
              @input=${this.handleSupportInput}
            >
            </sl-input>
            <span>UPD</span>
            ${this.needUpd
              ? html`
                  <sl-button
                    variant="primary"
                    @click=${() => this.updDialog.show()}
                  >
                    Get more UPD
                  </sl-button>
                `
              : html`
                  <sl-button variant="primary" type="submit">
                    Support this Idea
                  </sl-button>
                `}
            ${this.antiSpamFee
              ? html`<span>Anti-Spam Fee: ${this.antiSpamFee} UPD</span>`
              : html``}
          </div>
          ${this.depositError
            ? html` <div class="error">${this.depositError}</div>`
            : html``}
        </form>
        <p>${description}</p>
        ${tags
          ? html`
              <div class="tags">
                ${tags.map(
                  (tag) => html`
                    <a href="/discover?search=[${tag}]" class="tag">${tag}</a>
                  `
                )}
              </div>
            `
          : html``}
        <sl-button
          class="add-solution-button"
          href="/create-solution/${this.ideaId}"
          variant="primary"
          >Add Solution
        </sl-button>

        <share-dialog action="supported an Idea" .topic=${name}></share-dialog>
      `;
    } else {
      if (this.error) {
        return html`
          <div class="error-container">
            <h2>Error Loading Idea</h2>
            <p>${this.error}</p>
            <sl-button variant="primary" @click=${this.subscribe}
              >Retry
            </sl-button>
          </div>
        `;
      } else if (this.loaded) {
        return html`
          <div class="error-container">
            <h2>Idea Not Found</h2>
            <p>Check the id in the URL.</p>
            <sl-button href="/discover" variant="primary"
              >Browse Ideas
            </sl-button>
          </div>
        `;
      } else {
        return html` <sl-spinner></sl-spinner>`;
      }
    }
  }

  connectedCallback() {
    super.connectedCallback();
    layout.topBarContent.set(html`
      <create-idea-button></create-idea-button>
      <search-bar></search-bar>
    `);
    layout.showLeftSidebar.set(true);
    // initially set the right side bar to empty html
    layout.rightSidebarContent.set(html``);
    layout.showRightSidebar.set(true);
    // if the idea is found, it will populate the right sidebar
    this.subscribe();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubIdea?.();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('ideaId')) {
      this.subscribe();
    }
  }

  render() {
    return html`
      <main>
        ${cache(this.renderIdea())}
        <upd-dialog></upd-dialog>
        <sl-dialog label="Set Allowance">
          <p>
            Before you can support this Idea, you need to sign a transaction to
            allow the Idea contract to spend your UPD tokens.
          </p>
          <transaction-watcher
            class="approve"
            @transaction-success=${this.handleSubmit}
          ></transaction-watcher>
        </sl-dialog>
        <transaction-watcher
          class="submit"
          @transaction-success=${this.handleTransactionSuccess}
        >
        </transaction-watcher>
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'idea-page': IdeaPage;
  }
}
