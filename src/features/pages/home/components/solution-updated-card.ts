import { customElement } from 'lit/decorators.js';
import { html, css } from 'lit';
import { fromHex } from 'viem';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import { SolutionUpdated } from '@pages/home/types';
import { TrackedChangeCard } from './tracked-change-card';
import { SolutionInfo } from '@/features/solution/types';

@customElement('solution-updated-card')
export class SolutionUpdatedCard extends TrackedChangeCard {
  static styles = [
    ...TrackedChangeCard.styles,
    css`
      /* Additional styles specific to this card */
    `,
  ];

  // Type checking for the change property
  declare change: SolutionUpdated;

  render() {
    const solution = this.change.solution;
    if (solution?.info) {
      const solutionInfo: SolutionInfo = JSON.parse(
        fromHex(solution.info as `0x${string}`, 'string')
      );
      return html`
        <sl-card>
          <div slot="header">
            <a class="change-card-heading" href="/solution/${solution.id}"
              >${solutionInfo.name || `Solution ${solution.id}`}</a
            >
            <div class="change-card-subheading">has updates</div>
          </div>
          <a class="solution-body" href="/solution/${solution.id}">
            ${solutionInfo.news
              ? html`<p class="solution-news">${solutionInfo.news}</p>`
              : html``}
            ${solution ? this.renderSolutionDetails(solution) : ''}
          </a>
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
    'solution-updated-card': SolutionUpdatedCard;
  }
}
