import { customElement, property, query, state } from 'lit/decorators.js';
import { html, css, LitElement } from 'lit';
import { consume } from "@lit/context";
import { Task } from '@lit/task';
import { fromHex, formatUnits } from "viem";
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(relativeTime);
dayjs.extend(utc);

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import type { SlInput } from "@shoelace-style/shoelace";

import '@layout/top-bar';
import '@layout/left-side-bar';
import '@components/page-specific/idea-side-bar';
import '@components/upd-dialog';
import { UpdDialog } from "@components/upd-dialog.ts";

import urqlClient from '@/urql-client';
import { IdeaDocument } from '@gql';
import { IdeaContract } from '@contracts/idea';
import { balanceContext, RequestBalanceRefresh, updraftSettings } from '@/context';
import { UpdraftSettings, Balances, Idea } from "@/types";

@customElement('idea-page')
export class IdeaPage extends LitElement {
  static styles = css`
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

    .heading {
      font-size: 1.9rem;
      font-weight: 500;
      margin-bottom: 0;
    }

    .created {
      font-size: 0.9rem;
      margin-top: 0.4rem;
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
  `;

  @query('upd-dialog', true) updDialog!: UpdDialog;

  @state() private depositError: string | null = null;
  @state() private antiSpamFee: string | null = null;
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
      const percentFee= await ideaContract.read('percentFee') as bigint;
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
    } else if (value <= 1) {
      this.depositError = 'Deposit must be more than 1 UPD to cover fees';
    } else if (value > userBalance) {
      this.depositError = `You have ${userBalance} UPD`;
      this.needUpd = true;
    } else {
      this.depositError = null;
    }

    if (this.depositError) {
      input.style.setProperty('--sl-input-focus-ring-color', 'red');
      input.classList.add('invalid');
    } else {
      input.style.removeProperty('--sl-input-focus-ring-color');
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

  private handleSupportClick() {

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
              return html`
                <h1 class="heading">Idea: ${idea.name}</h1>
                <a href="/profile/${creator.id}">by ${profile.name || creator.id}</a>
                <span class="created">Created ${date.format('MMM D, YYYY [at] h:mm A UTC')} (${date.fromNow()})</span>
                <span>${funderReward * 100}% reward</span>
                <span>${shares} fire</span>
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
                    <sl-button variant="primary" @click=${this.handleSupportClick}>
                      Support this Idea
                    </sl-button>
                  `}
                  ${this.antiSpamFee ? html`<span>Anti-Spam Fee: ${this.antiSpamFee} UPD</span>` : ''}
                </div>
                ${this.depositError ? html`
                  <div class="error">${this.depositError}</div>` : ''}
                <p>${description}</p>
                ${tags ? html`
                  <div class="tags">
                    ${tags.map((tag) => html`<span class="tag">${tag}</span>`)}
                  </div>
                ` : ''}
                <upd-dialog></upd-dialog>
              `
            }
          })}
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
