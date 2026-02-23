import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import '@components/solution/solution-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { UrqlQueryController } from '@utils/urql-query-controller';
import { SolutionsByIdeaDocument } from '@gql';
import { Solution } from '@/features/solution/types';

@customElement('other-solutions')
export class OtherSolutions extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    h2 {
      margin-top: 0;
      font-size: 1.25rem;
    }

    .solutions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .no-solutions {
      color: var(--no-results);
      font-style: italic;
    }
  `;

  @property({ type: String }) ideaId = '';
  @property({ type: String }) currentSolutionId = '';
  @state() private solutions?: Solution[];

  // Controller for fetching solutions for this idea
  private readonly solutionsController = new UrqlQueryController(
    this,
    SolutionsByIdeaDocument,
    {
      ideaId: this.ideaId,
      first: 5,
      detailed: false,
    },
    (result) => {
      if (result.error) {
        console.error('Error fetching other solutions:', result.error);
        this.solutions = [];
        return;
      }

      // Filter out the current solution
      const allSolutions = result.data?.solutions as Solution[];
      this.solutions = allSolutions?.filter((solution) => solution.id !== this.currentSolutionId) || [];
    }
  );

  updated(changedProperties: Map<string, unknown>) {
    if ((changedProperties.has('ideaId') || changedProperties.has('currentSolutionId')) && this.ideaId) {
      this.solutionsController.setVariablesAndSubscribe({
        ideaId: this.ideaId,
        first: 5,
        detailed: false,
      });
    }
  }

  render() {
    return html`
      <div>
        <h2>Other Solutions</h2>
        ${this.solutions === undefined
          ? html` <sl-spinner></sl-spinner>`
          : this.solutions.length > 0
            ? cache(html`
                <div class="solutions-list">
                  ${this.solutions.map(
                    (solution) => html` <solution-card-small .solution=${solution}></solution-card-small> `
                  )}
                </div>
              `)
            : html` <div class="no-solutions">No other solutions</div> `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'other-solutions': OtherSolutions;
  }
}
