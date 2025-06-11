import { customElement, property } from 'lit/decorators.js';
import { html, css, LitElement } from 'lit';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import '@shoelace-style/shoelace/dist/components/card/card.js';

import '@components/solution/solution-details-bar';
import '@components/common/vertical-fade';

import { NewSolution } from '@pages/home/types';

import { parseSolutionInfo } from '@utils/solution/solution-utils';
import { parseProfile } from '@utils/user/user-utils';
import { formatText } from '@utils/format-utils';

import { changeCardStyles } from '@styles/change-card-styles';

@customElement('new-solution-card')
export class NewSolutionCard extends LitElement {
  static styles = [
    changeCardStyles,
    css`
      h4 {
        font-size: 1rem;
        margin: 0;
      }
      .byline {
        font-size: 0.75rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 26rem;
      }
    `,
  ];

  @property({ type: Object }) change!: NewSolution;

  render() {
    const solution = this.change.solution;

    if (solution?.info) {
      const solutionInfo = parseSolutionInfo(solution.info);
      const drafterProfile = parseProfile(
        solution.drafter.profile as `0x${string}`
      );
      return html`
        <sl-card>
          <div slot="header">
            <a class="change-card-heading" href="/idea/${solution.idea.id}">
              ${this.change.solution.idea.name}
            </a>
            <div class="change-card-subheading">has a new Solution 📃</div>
          </div>

          <div class="solution-info">
            <a class="new-solution-heading" href="/solution/${solution.id}"
              >${solutionInfo.name}</a
            >
            <div class=" byline">
              by
              <a href="/profile/${solution.drafter.id}">
                ${drafterProfile.name ||
                drafterProfile.team ||
                solution.drafter.id}
              </a>
            </div>
            <a class="solution-body" href="/solution/${solution.id}">
              <vertical-fade
                >${formatText(solutionInfo.description)}
              </vertical-fade>
              <solution-details-bar
                .solution=${solution}
              ></solution-details-bar>
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
