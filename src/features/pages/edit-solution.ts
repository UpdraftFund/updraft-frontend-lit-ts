import { LitElement, html, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { cache } from 'lit/directives/cache.js';

import { toHex, formatUnits, parseUnits } from 'viem';
import dayjs from 'dayjs';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import { SlInput } from '@shoelace-style/shoelace';

// Components
import '@components/common/transaction-watcher';
import '@components/common/upd-dialog';
import '@layout/page-heading';
import '@components/common/label-with-hint';
import '@components/common/token-input';
import '@components/common/formatted-text-input';
import { TransactionWatcher } from '@components/common/transaction-watcher';

// Utilities
import { formatAmount } from '@utils/format-utils';
import { UrqlQueryController } from '@utils/urql-query-controller';
import { modal } from '@utils/web3';
import { goalReached, parseSolutionInfo } from '@utils/solution/solution-utils';

// GraphQL
import { SolutionDocument } from '@gql';
import { Solution, SolutionInfo } from '@/features/solution/types';

// Contracts
import { SolutionContract } from '@contracts/solution';

// State
import layout from '@state/layout';
import { userAddress } from '@state/user';

@customElement('edit-solution')
export class EditSolution extends SignalWatcher(LitElement) {
  static styles = css`
    form {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      max-width: 70rem;
      margin: 1.5rem 3rem;
    }

    h2 {
      margin: 0;
    }

    sl-input[name='deadline'] {
      width: calc(16ch + var(--sl-input-spacing-medium) * 2);
    }

    sl-button {
      max-width: fit-content;
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
      color: var(--no-results);
    }

    /* Responsive behavior for smaller screens */
    @media (max-width: 768px) {
      form {
        margin: 1rem;
      }
    }
  `;

  @query('transaction-watcher.update', true)
  updateTransaction!: TransactionWatcher;
  @query('transaction-watcher.extend', true)
  extendTransaction!: TransactionWatcher;
  @query('transaction-watcher.combined', true)
  combinedTransaction!: TransactionWatcher;
  @query('sl-input[name="goal"]', true) goalInput!: SlInput;
  @query('sl-input[name="deadline"]', true) deadlineInput!: SlInput;
  @query('form', true) form!: HTMLFormElement;

  @property() solutionId!: `0x${string}`;
  @property() tokenSymbol: string | null = null;

  @state() private solution?: Solution;
  @state() private solutionInfo?: SolutionInfo;
  @state() private loaded = false;
  @state() private error: string | null = null;

  // Controller for fetching solution data
  private readonly solutionController = new UrqlQueryController(
    this,
    SolutionDocument,
    { solutionId: this.solutionId },
    (result) => {
      this.loaded = true;
      if (result.error) {
        console.error('Error fetching solution data:', result.error);
        this.error = `Error loading solution: ${result.error.message}`;
        return;
      }
      if (result.data?.solution) {
        this.solution = result.data.solution as Solution;
        this.solutionInfo = parseSolutionInfo(this.solution.info);
        layout.topBarContent.set(html` <page-heading>Edit "${this.solutionInfo?.name || 'Solution'}" </page-heading> `);
      } else {
        this.error = 'Solution not found';
      }
    }
  );

  private handleFormSubmit(e: Event) {
    e.preventDefault();
  }

  private getSolutionInfoFromForm() {
    const formData = new FormData(this.form);
    const info = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      news: (formData.get('news') as string) || undefined,
      repository: (formData.get('repository') as string) || undefined,
    };
    return toHex(JSON.stringify(info));
  }

  private async updateSolution() {
    if (!this.form.checkValidity()) {
      this.form.reportValidity();
      return;
    }
    try {
      const solutionContract = new SolutionContract(this.solutionId);
      this.updateTransaction.hash = await solutionContract.write('updateSolution', [this.getSolutionInfoFromForm()]);
    } catch (e) {
      console.error('Update solution error:', e);
      if (e instanceof Error && e.message.startsWith('connection')) {
        modal.open({ view: 'Connect' });
      }
    }
  }

  private async extendGoal() {
    if (!this.form.checkValidity()) {
      this.form.reportValidity();
      return;
    }
    const deadline = dayjs(this.deadlineInput.value).unix();
    const goal = parseUnits(this.goalInput.value, 18);
    try {
      const solutionContract = new SolutionContract(this.solutionId);
      this.extendTransaction.hash = await solutionContract.write('extendGoal', [goal, BigInt(deadline)]);
    } catch (e) {
      console.error('Extend goal error:', e);
      if (e instanceof Error && e.message.startsWith('connection')) {
        modal.open({ view: 'Connect' });
      }
    }
  }

  private async updateSolutionAndExtendGoal() {
    if (!this.form.checkValidity()) {
      this.form.reportValidity();
      return;
    }
    const deadline = dayjs(this.deadlineInput.value).unix();
    const goal = parseUnits(this.goalInput.value, 18);
    try {
      const solutionContract = new SolutionContract(this.solutionId);
      this.combinedTransaction.hash = await solutionContract.write('extendGoal', [
        goal,
        BigInt(deadline),
        this.getSolutionInfoFromForm(),
      ]);
    } catch (e) {
      console.error('Update and extend error:', e);
      if (e instanceof Error && e.message.startsWith('connection')) {
        modal.open({ view: 'Connect' });
      }
    }
  }

  private handleSuccess() {
    // Redirect to solution page after successful update
    window.location.href = `/solution/${this.solutionId}`;
  }

  public get isUserDrafter() {
    return userAddress.get()?.toLowerCase() === this.solution?.drafter.id.toLowerCase();
  }

  connectedCallback() {
    super.connectedCallback();
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(false);
    layout.rightSidebarContent.set(html``);

    // Set default heading until we load the solution
    layout.topBarContent.set(html` <page-heading>Edit Solution</page-heading> `);

    this.loaded = false;

    const urlParams = new URLSearchParams(window.location.search);
    this.tokenSymbol = urlParams.get('tokenSymbol');
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    // Update controller variables if solutionId changes
    if (changedProperties.has('solutionId') && this.solutionId) {
      this.loaded = false;
      this.error = null;
      this.solution = undefined;
      this.solutionInfo = undefined;

      // Update the solution controller with the new ID
      this.solutionController.setVariablesAndSubscribe({
        solutionId: this.solutionId,
      });
    }
  }

  render() {
    return cache(html`
      ${!this.loaded
        ? html`
            <div class="loading-container">
              <sl-spinner></sl-spinner>
            </div>
          `
        : this.error
          ? html`
              <div class="error-container">
                <h2>Error</h2>
                <p>${this.error}</p>
                <sl-button href="/discover?tab=solutions" variant="primary"> Browse Solutions </sl-button>
              </div>
            `
          : !this.isUserDrafter
            ? html`
                <div class="error-container">
                  <h2>Not the Drafter</h2>
                  <p>Only the Drafter of this Solution can edit it.</p>
                  <sl-button href="/solution/${this.solutionId}" variant="primary"> View Solution </sl-button>
                </div>
              `
            : html`
                <form name="edit-solution" @submit=${this.handleFormSubmit}>
                  ${goalReached(this.solution)
                    ? html`
                        <h2>Extend Goal and Deadline</h2>
                        <sl-input
                          name="goal"
                          type="number"
                          min="${formatUnits(BigInt(this.solution!.fundingGoal) + 100000n, 18)}"
                          step="any"
                          required
                        >
                          <label-with-hint
                            slot="label"
                            label="New Funding Goal*"
                            hint="Must be higher than the previous goal of ${formatAmount(
                              this.solution!.fundingGoal
                            )} ${this.tokenSymbol}"
                          ></label-with-hint>
                        </sl-input>

                        <sl-input
                          name="deadline"
                          type="date"
                          required
                          min="${dayjs().add(1, 'day').format('YYYY-MM-DD')}"
                        >
                          <label-with-hint slot="label" label="New Deadline*"></label-with-hint>
                        </sl-input>

                        <sl-button variant="primary" @click=${this.extendGoal}> Extend Goal Only </sl-button>
                      `
                    : html``}
                  <sl-input name="name" required autocomplete="off" value=${this.solutionInfo?.name || ''}>
                    <label-with-hint slot="label" label="Name*" hint="A short name for your solution"></label-with-hint>
                  </sl-input>

                  <formatted-text-input name="description" .value=${this.solutionInfo?.description || ''} required>
                    <label-with-hint
                      slot="label"
                      label="Description*"
                      hint="A description of your solution. You can use markdown or paste formatted text."
                    ></label-with-hint>
                  </formatted-text-input>

                  <formatted-text-input name="news" .value=${this.solutionInfo?.news || ''}>
                    <label-with-hint
                      slot="label"
                      label="News"
                      hint="Share your progress. You can use markdown or paste formatted text."
                    ></label-with-hint>
                  </formatted-text-input>

                  ${goalReached(this.solution)
                    ? html`
                        <sl-button variant="primary" @click=${this.updateSolutionAndExtendGoal}>
                          Update Solution and Extend Goal
                        </sl-button>
                      `
                    : html` <sl-button variant="primary" @click=${this.updateSolution}> Update Solution </sl-button> `}
                  <transaction-watcher class="update" @transaction-success=${this.handleSuccess}></transaction-watcher>
                  <transaction-watcher class="extend" @transaction-success=${this.handleSuccess}></transaction-watcher>
                  <transaction-watcher
                    class="combined"
                    @transaction-success=${this.handleSuccess}
                  ></transaction-watcher>
                </form>
              `}
    `);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edit-solution': EditSolution;
  }
}
