import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { SignalWatcher } from '@lit-labs/signals';

import '@components/common/section-heading';
import '@components/solution/solution-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { userAddress } from '@state/user';

import urqlClient from '@utils/urql-client';
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

    .loading {
      padding: 1rem;
      color: var(--sl-color-neutral-500);
    }
  `;

  @state() private solutions?: Solution[];

  // Track the current user address to detect changes
  private lastUserAddress: string | null = null;

  private unsubSolutions?: () => void;

  private subscribe(address: `0x${string}`) {
    // Clean up previous subscription if it exists
    this.unsubSolutions?.();

    const solutionsSub = urqlClient
      .query(SolutionsByFunderOrDrafterDocument, {
        user: address,
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
      const currentAddress = userAddress.get();
      if (currentAddress) {
        this.subscribe(currentAddress);
      }
    }
  };

  connectedCallback() {
    super.connectedCallback();
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
    const currentUserAddress = userAddress.get();
    if (currentUserAddress && this.lastUserAddress !== currentUserAddress) {
      this.lastUserAddress = currentUserAddress;
      this.subscribe(currentUserAddress);
    }

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
