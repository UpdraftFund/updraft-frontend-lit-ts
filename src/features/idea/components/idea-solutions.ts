import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import '@components/solution/solution-card-large';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { UrqlQueryController } from '@utils/urql-query-controller';
import { SolutionsByIdeaDocument } from '@gql';
import { Solution } from '@/types';

@customElement('idea-solutions')
export class IdeaSolutions extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .solutions-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .no-solutions {
      color: var(--subtle-text);
      font-style: italic;
      margin-top: 1rem;
    }
  `;

  @property({ type: String }) ideaId = '';
  @state() private solutions?: Solution[];

  // Controller for fetching solutions for this idea
  private readonly solutionsController = new UrqlQueryController(
    this,
    SolutionsByIdeaDocument,
    {
      ideaId: this.ideaId,
      detailed: true,
    },
    (result) => {
      if (result.error) {
        console.error('Error fetching solutions for idea:', result.error);
        this.solutions = [];
        return;
      }

      this.solutions = (result.data?.solutions as Solution[]) || [];
    }
  );

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('ideaId') && this.ideaId) {
      this.solutionsController.setVariablesAndSubscribe({
        ideaId: this.ideaId,
        detailed: true,
      });
    }
  }

  render() {
    return html`
      <div>
        ${this.solutions === undefined
          ? html` <sl-spinner></sl-spinner>`
          : this.solutions.length > 0
            ? cache(html`
                <div class="solutions-list">
                  ${this.solutions.map(
                    (solution) => html`
                      <solution-card-large
                        .solution=${solution}
                      ></solution-card-large>
                    `
                  )}
                </div>
              `)
            : html`
                <div class="no-solutions">
                  No solutions yet. Be the first to add one!
                </div>
              `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'idea-solutions': IdeaSolutions;
  }
}
