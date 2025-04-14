import { customElement } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { Task } from '@lit/task';
import { consume } from '@lit/context';

import '@components/common/section-heading';
import '@components/solution/solution-card-small';

import { connectionContext } from '@state/common/context';
import { Connection } from '@/types/user/current-user';

import urqlClient from '@utils/urql-client';
import { SolutionsByFunderOrDrafterDocument } from '@gql';

@customElement('my-solutions')
export class MySolutions extends SignalWatcher(LitElement) {
  @consume({ context: connectionContext, subscribe: true })
  connection?: Connection;

  static styles = css`
    :host {
      display: block;
    }

    .content {
      padding: 1rem 1.4rem 0;
      box-sizing: border-box;
    }

    solution-card-small {
      width: 100%;
    }
  `;

  private solutionsTask = new Task(this, {
    task: async ([user]) => {
      if (user) {
        const result = await urqlClient.query(
          SolutionsByFunderOrDrafterDocument,
          { user }
        );

        // Get solutions from both queries
        const fundedSolutions =
          result.data?.fundedSolutions?.map(
            (contribution) => contribution.solution
          ) || [];
        const draftedSolutions = result.data?.draftedSolutions || [];

        // Combine and deduplicate solutions based on their ID
        const solutionMap = new Map();

        // Add funded solutions to map
        fundedSolutions.forEach((solution) => {
          solutionMap.set(solution.id, solution);
        });

        // Add drafted solutions to map (will overwrite any duplicates)
        draftedSolutions.forEach((solution) => {
          solutionMap.set(solution.id, solution);
        });

        // Convert map values back to array
        return Array.from(solutionMap.values());
      }
    },
    args: () => [this.connection?.address],
  });

  render() {
    return html`
      <section-heading>My Solutions</section-heading>
      <div class="content">
        ${this.solutionsTask.render({
          pending: () => html`Loading your solutions...`,
          complete: (solutions) => {
            return solutions?.map(
              (solution) =>
                html` <solution-card-small
                  .solution=${solution}
                ></solution-card-small>`
            );
          },
          error: (error) => {
            console.group('Error loading my-solutions');
            console.dir(error);
            console.groupEnd();
          },
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-solutions': MySolutions;
  }
}
