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
  `;

  @state() private solutions: Solution[] = [];
  @state() private loading = false;

  // Track the current user address to detect changes
  private lastAddress: string | null = null;

  private unsubSolutions?: () => void;

  private subscribe(address: `0x${string}`) {
    // Clean up previous subscription if it exists
    this.unsubSolutions?.();
    this.loading = true;
    const solutionsSub = urqlClient
      .query(SolutionsByFunderOrDrafterDocument, {
        user: address,
      })
      .subscribe((result) => {
        this.loading = false;
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
      });
    this.unsubSolutions = solutionsSub.unsubscribe;
  }

  private checkForAddressChangeAndSubscribe() {
    const currentAddress = userAddress.get();
    if (this.lastAddress !== currentAddress) {
      this.lastAddress = currentAddress;
      if (currentAddress) {
        this.subscribe(currentAddress);
      }
    }
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
    this.checkForAddressChangeAndSubscribe();
    return html`
      <section-heading>My Solutions</section-heading>
      <div class="content">
        ${this.loading
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
