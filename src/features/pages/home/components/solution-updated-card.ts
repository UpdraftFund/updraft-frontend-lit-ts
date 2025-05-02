import { customElement } from 'lit/decorators.js';
import { html, css } from 'lit';
import { SolutionUpdated } from '@pages/home/types';
import { TrackedChangeCard } from './tracked-change-card';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { fromHex } from 'viem';
import { SolutionInfo } from '@/features/solution/types';

dayjs.extend(relativeTime);

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

    let solutionInfo: SolutionInfo | null = null;
    if (solution?.info) {
      try {
        solutionInfo = JSON.parse(
          fromHex(solution.info as `0x${string}`, 'string')
        );
      } catch (e) {
        console.error('Error parsing solution info', e);
      }
    }

    return html`
      <sl-card>
        <div slot="header">
          <a class="change-card-heading">${solutionInfo?.name || 'Solution'}</a>
          <div class="change-card-subheading">has updates</div>
        </div>

        ${solutionInfo
          ? html`
              <div class="solution-info">
                ${solutionInfo.news
                  ? html`<p class="solution-news">${solutionInfo.news}</p>`
                  : ''}
              </div>
            `
          : ''}
        ${solution ? this.renderSolutionDetails(solution) : ''}

        <div slot="footer">${dayjs(this.change.time).fromNow()}</div>
      </sl-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'solution-updated-card': SolutionUpdatedCard;
  }
}
