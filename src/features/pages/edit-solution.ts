import { LitElement, html, css, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import { cache } from 'lit/directives/cache.js';

import { fromHex, toHex, formatUnits, parseUnits } from 'viem';
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
import { TransactionWatcher } from '@components/common/transaction-watcher';

// Utilities
import { UrqlQueryController } from '@utils/urql-query-controller';
import { modal } from '@utils/web3';

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
    :host {
      width: 100%;
      overflow: hidden;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      margin: 1.5rem 3rem;
    }

    sl-input,
    sl-textarea {
      width: 100%;
    }

    sl-button {
      max-width: fit-content;
    }

    .button-group {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }

    .goal-extension {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--sl-color-neutral-200);
    }

    .input-with-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .current-value {
      font-size: 0.9rem;
      color: var(--sl-color-neutral-700);
      margin: 0;
      padding: 0;
    }

    .hint-text {
      font-size: 0.85rem;
      color: var(--sl-color-neutral-600);
      font-style: italic;
      margin-top: 0.5rem;
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
  @state() private isUserDrafter = false;
  @state() private goalReached = false;

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

        // Parse solution info from hex
        try {
          if (this.solution.info) {
            this.solutionInfo = JSON.parse(
              fromHex(this.solution.info as `0x${string}`, 'string')
            );
          }

          // Set page heading
          layout.topBarContent.set(html`
            <page-heading
              >Edit "${this.solutionInfo?.name || 'Solution'}"
            </page-heading>
          `);

          // Check if user is the drafter
          const currentAddress = userAddress.get();
          this.isUserDrafter =
            currentAddress?.toLowerCase() ===
            this.solution.drafter.id.toLowerCase();

          // Check if goal is reached
          const tokensContributed = BigInt(
            this.solution.tokensContributed || '0'
          );
          const fundingGoal = BigInt(this.solution.fundingGoal || '0');
          this.goalReached = tokensContributed >= fundingGoal;
        } catch (e) {
          console.error('Error parsing solution info:', e);
          this.error = 'Error parsing solution data';
        }
      } else {
        this.error = 'Solution not found';
      }
    }
  );

  private handleFormSubmit(e: Event) {
    e.preventDefault();
  }

  /**
   * Extract solution info from the form
   * @returns SolutionInfo object with form data
   */
  private getSolutionInfoFromForm(): SolutionInfo {
    const formData = new FormData(this.form);
    return {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      news: (formData.get('news') as string) || undefined,
      repository: (formData.get('repository') as string) || undefined,
    };
  }

  private async updateSolution() {
    if (!this.form.checkValidity()) {
      this.form.reportValidity();
      return;
    }

    try {
      const updatedInfo = this.getSolutionInfoFromForm();

      const solutionContract = new SolutionContract(this.solutionId);
      this.updateTransaction.hash = await solutionContract.write(
        'updateSolution',
        [toHex(JSON.stringify(updatedInfo))]
      );
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
      this.extendTransaction.hash = await solutionContract.write('extendGoal', [
        goal,
        BigInt(deadline),
      ]);
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
      const updatedInfo = this.getSolutionInfoFromForm();
      const solutionContract = new SolutionContract(this.solutionId);
      this.combinedTransaction.hash = await solutionContract.write(
        'extendGoal',
        [goal, BigInt(deadline), toHex(JSON.stringify(updatedInfo))]
      );
    } catch (e) {
      console.error('Update and extend error:', e);
      if (e instanceof Error && e.message.startsWith('connection')) {
        modal.open({ view: 'Connect' });
      }
    }
  }

  private handleUpdateSuccess() {
    // Redirect to solution page after successful update
    window.location.href = `/solution/${this.solutionId}`;
  }

  private handleExtendSuccess() {
    // Redirect to solution page after successful extension
    window.location.href = `/solution/${this.solutionId}`;
  }

  private handleCombinedSuccess() {
    // Redirect to solution page after successful combined update
    window.location.href = `/solution/${this.solutionId}`;
  }

  connectedCallback() {
    super.connectedCallback();
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(false);
    layout.rightSidebarContent.set(html``);

    // Set default heading until we load the solution
    layout.topBarContent.set(html`
      <page-heading>Edit Solution</page-heading>
    `);

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
      this.isUserDrafter = false;
      this.goalReached = false;

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
                <sl-button href="/discover?tab=solutions" variant="primary">
                  Browse Solutions
                </sl-button>
              </div>
            `
          : !this.isUserDrafter
            ? html`
                <div class="error-container">
                  <h2>Access Denied</h2>
                  <p>Only the drafter of this solution can edit it.</p>
                  <sl-button
                    href="/solution/${this.solutionId}"
                    variant="primary"
                  >
                    View Solution
                  </sl-button>
                </div>
              `
            : html`
                <form name="edit-solution" @submit=${this.handleFormSubmit}>
                  <sl-input
                    name="name"
                    required
                    autocomplete="off"
                    value=${this.solutionInfo?.name || ''}
                  >
                    <label-with-hint
                      slot="label"
                      label="Name*"
                      hint="A short name for your solution"
                    ></label-with-hint>
                  </sl-input>

                  <sl-textarea
                    name="description"
                    required
                    resize="auto"
                    value=${this.solutionInfo?.description || ''}
                  >
                    <label-with-hint
                      slot="label"
                      label="Description*"
                      hint="A description of your solution"
                    ></label-with-hint>
                  </sl-textarea>

                  <sl-textarea
                    name="news"
                    resize="auto"
                    value=${this.solutionInfo?.news || ''}
                  >
                    <label-with-hint
                      slot="label"
                      label="Latest Updates"
                      hint="Share the latest progress on your solution"
                    ></label-with-hint>
                  </sl-textarea>

                  <sl-input
                    name="repository"
                    autocomplete="off"
                    value=${this.solutionInfo?.repository || ''}
                  >
                    <label-with-hint
                      slot="label"
                      label="Repository"
                      hint="Link to your solution's code repository"
                    ></label-with-hint>
                  </sl-input>

                  <div class="button-group">
                    <sl-button
                      href="/solution/${this.solutionId}"
                      variant="neutral"
                    >
                      Cancel
                    </sl-button>
                    <sl-button variant="primary" @click=${this.updateSolution}>
                      Update Solution
                    </sl-button>
                  </div>

                  ${this.goalReached
                    ? html`
                        <div class="goal-extension">
                          <h2>Extend Goal and Deadline</h2>
                          <p>
                            Your solution has reached its goal! You can extend
                            the goal and deadline to continue funding.
                          </p>

                          <div class="input-with-info">
                            <p class="current-value">
                              Current goal:
                              ${formatUnits(this.solution?.fundingGoal, 18)}
                              ${this.tokenSymbol}
                            </p>
                            <sl-input
                              name="goal"
                              type="number"
                              min="${this.solution
                                ? Number(
                                    formatUnits(
                                      this.solution.fundingGoal + 1n,
                                      18
                                    )
                                  )
                                : 0}"
                              required
                            >
                              <label-with-hint
                                slot="label"
                                label="New Funding Goal*"
                                hint="Must be higher than the current goal"
                              ></label-with-hint>
                            </sl-input>
                          </div>

                          <div class="input-with-info">
                            <p class="current-value">
                              Current deadline:
                              ${this.solution
                                ? dayjs
                                    .unix(Number(this.solution.deadline))
                                    .format('YYYY-MM-DD')
                                : 'N/A'}
                            </p>
                            <sl-input
                              name="deadline"
                              type="date"
                              required
                              min="${dayjs()
                                .add(1, 'day')
                                .format('YYYY-MM-DD')}"
                            >
                              <label-with-hint
                                slot="label"
                                label="New Deadline*"
                                hint="Must be at least one day in the future"
                              ></label-with-hint>
                            </sl-input>
                          </div>

                          <div class="button-group">
                            <sl-button
                              variant="primary"
                              @click=${this.extendGoal}
                            >
                              Extend Goal Only
                            </sl-button>
                            <sl-button
                              variant="primary"
                              @click=${this.updateSolutionAndExtendGoal}
                            >
                              Update Solution and Extend Goal
                            </sl-button>
                          </div>
                          <p class="hint-text">
                            Tip: Using "Update Solution and Extend Goal" saves
                            time and gas by combining both actions into a single
                            transaction.
                          </p>
                        </div>
                      `
                    : nothing}
                </form>

                <transaction-watcher
                  class="update"
                  @transaction-success=${this.handleUpdateSuccess}
                ></transaction-watcher>
                <transaction-watcher
                  class="extend"
                  @transaction-success=${this.handleExtendSuccess}
                ></transaction-watcher>
                <transaction-watcher
                  class="combined"
                  @transaction-success=${this.handleCombinedSuccess}
                ></transaction-watcher>
              `}
    `);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edit-solution': EditSolution;
  }
}
