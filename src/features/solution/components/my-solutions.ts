import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { consume } from '@lit/context';

import '@components/common/section-heading';
import '@components/solution/solution-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { connectionContext } from '@state/common/context';
import { Connection } from '@/types/user/current-user';

import urqlClient from '@utils/urql-client';
import { SolutionsByFunderOrDrafterDocument } from '@gql';
import { Solution } from '@/types';

@customElement('my-solutions')
export class MySolutions extends LitElement {
  @consume({ context: connectionContext, subscribe: true })
  connection?: Connection;

  @state() private solutions?: Solution[];
  private unsubSolutions?: () => void;

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

    .loading {
      padding: 1rem;
      color: var(--sl-color-neutral-500);
    }
  `;

  private subscribe() {
    // Clean up previous subscription if it exists
    this.unsubSolutions?.();

    if (!this.connection?.address) return;

    const solutionsSub = urqlClient
      .query(SolutionsByFunderOrDrafterDocument, {
        user: this.connection.address,
      })
      .subscribe((result) => {
        if (result.data) {
          // Get solutions from both queries
          const fundedSolutions =
            result.data.fundedSolutions?.map(
              (contribution) => contribution.solution
            ) || [];
          const draftedSolutions = result.data.draftedSolutions || [];

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
          this.solutions = Array.from(solutionMap.values());
        } else {
          this.solutions = [];
        }
      });

    this.unsubSolutions = solutionsSub.unsubscribe;
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.unsubSolutions?.();
    } else {
      this.subscribe();
    }
  };

  connectedCallback() {
    super.connectedCallback();
    if (this.connection?.address) {
      this.subscribe();
    }
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubSolutions?.();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
  }

  render() {
    return html`
      <section-heading>My Solutions</section-heading>
      <div class="content">
        ${this.solutions === undefined
          ? html` <sl-spinner></sl-spinner>`
          : cache(
              this.solutions.map(
                (solution) => html`
                  <solution-card-small
                    .solution=${solution}
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
