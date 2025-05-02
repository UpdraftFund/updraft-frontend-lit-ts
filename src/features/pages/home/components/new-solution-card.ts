import { customElement } from 'lit/decorators.js';
import { html, css } from 'lit';
import { fromHex } from 'viem';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { TrackedChangeCard } from './tracked-change-card';

import { NewSolution } from '@pages/home/types';
import { SolutionInfo, Profile } from '@/types';

@customElement('new-solution-card')
export class NewSolutionCard extends TrackedChangeCard {
  static styles = [
    ...TrackedChangeCard.styles,
    css`
      h4 {
        font-size: 1rem;
        margin: 0;
      }
      .byline {
        font-size: 0.75rem;
      }
    `,
  ];

  // Type checking for the change property
  declare change: NewSolution;

  render() {
    const solution = this.change.solution;

    if (solution?.info) {
      const solutionInfo: SolutionInfo = JSON.parse(
        fromHex(solution.info as `0x${string}`, 'string')
      );
      const drafterProfile: Profile = JSON.parse(
        fromHex(solution.drafter.profile as `0x${string}`, 'string')
      );
      return html`
        <sl-card>
          <div slot="header">
            <a class="change-card-heading" href="/idea/${solution.idea.id}">
              ${this.change.solution.idea.name}
            </a>
            <div class="change-card-subheading">has a new solution</div>
          </div>

          <div class="solution-info"
          ">
          <a class="new-solution-heading" href="/solution/${solution.id}">${solutionInfo.name}</a>
          <div class=" byline">
            by
            <a href=${solution.drafter.id}>
              ${
                drafterProfile.name ||
                drafterProfile.team ||
                solution.drafter.id
              }
            </a>
          </div>
          <a class="solution-body" href="/solution/${solution.id}">
            <p>${solutionInfo.description}</p>
            ${solution ? this.renderSolutionDetails(solution) : ''}
          </a>
          </div>

          <div slot="footer">${dayjs(this.change.time).fromNow()}</div>
        </sl-card>
      `;
    } else {
      return html``;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'new-solution-card': NewSolutionCard;
  }
}
