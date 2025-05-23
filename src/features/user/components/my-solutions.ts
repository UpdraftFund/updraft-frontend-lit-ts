import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { SignalWatcher } from '@lit-labs/signals';

import '@components/common/section-heading';
import '@components/solution/solution-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { UrqlQueryController } from '@utils/urql-query-controller';
import { SolutionsByFunderOrDrafterDocument } from '@gql';
import { Solution } from '@/types';

@customElement('my-solutions')
export class MySolutions extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
    }

    .content {
      padding: 1rem 0 0;
      box-sizing: border-box;
    }

    solution-card-small {
      width: 100%;
    }

    .empty-message {
      padding: 1rem;
      color: var(--no-results);
      font-size: var(--sl-font-size-small);
      text-align: center;
      font-style: italic;
    }
  `;

  @property({ type: String }) address: string | null = null;
  @state() private solutions: Solution[] = [];
  @state() private loading = true;

  // Controller for fetching solutions
  private readonly solutionsController = new UrqlQueryController(
    this,
    SolutionsByFunderOrDrafterDocument,
    { user: this.address || '' },
    (result) => {
      this.loading = false;

      if (result.error) {
        console.error('Error fetching solutions:', result.error);
        this.solutions = [];
        return;
      }

      if (result.data) {
        // Create a map to store solutions with their activity timestamps
        const solutionActivityMap = new Map();

        // Process funded solutions
        const fundedSolutions = result.data.fundedSolutions || [];
        fundedSolutions.forEach((contribution) => {
          const solution = contribution.solution;
          // Store the solution with its activity time (contribution time)
          solutionActivityMap.set(solution.id, {
            solution,
            // Use the latest activity time if this solution already exists in the map
            activityTime: Math.max(
              Number(contribution.createdTime),
              solutionActivityMap.get(solution.id)?.activityTime || 0
            ),
          });
        });

        // Process drafted solutions
        const draftedSolutions = result.data.draftedSolutions || [];
        draftedSolutions.forEach((solution) => {
          // Store the solution with its activity time (creation time)
          solutionActivityMap.set(solution.id, {
            solution,
            // Use the latest activity time if this solution already exists in the map
            activityTime: Math.max(
              Number(solution.startTime),
              solutionActivityMap.get(solution.id)?.activityTime || 0
            ),
          });
        });

        // Sort solutions by activity time (newest first) and extract just the solutions
        this.solutions = Array.from(solutionActivityMap.values())
          .sort((a, b) => b.activityTime - a.activityTime)
          .map((item) => item.solution);
      } else {
        this.solutions = [];
      }
    }
  );

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    if (changedProperties.has('address') && this.address) {
      this.loading = true;
      this.solutionsController.setVariablesAndSubscribe({
        user: this.address,
      });
    }
  }

  render() {
    return html`
      <section-heading>🧩 My Solutions</section-heading>
      <div class="content">
        ${this.loading
          ? html` <sl-spinner></sl-spinner>`
          : this.solutions.length === 0
            ? html`<div class="empty-message">
                You haven't funded or drafted any solutions yet.
              </div>`
            : cache(
                this.solutions.map(
                  (solution) => html`
                    <solution-card-small
                      .solution=${solution}
                      .showStake=${false}
                    ></solution-card-small>
                  `
                )
              )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-solutions': MySolutions;
  }
}
