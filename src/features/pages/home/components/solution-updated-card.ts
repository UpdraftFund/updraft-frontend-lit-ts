import { customElement, property } from 'lit/decorators.js';
import { html, css, LitElement } from 'lit';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

import '@shoelace-style/shoelace/dist/components/card/card.js';

import '@components/solution/solution-details-bar';
import '@components/common/vertical-fade';

import { SolutionUpdated } from '@pages/home/types';

import { parseSolutionInfo } from '@utils/solution/solution-utils';
import { formatText } from '@utils/format-utils';

import { changeCardStyles } from '@styles/change-card-styles';

@customElement('solution-updated-card')
export class SolutionUpdatedCard extends LitElement {
  static styles = [
    changeCardStyles,
    css`
      /* Additional styles specific to this card */
    `,
  ];

  @property({ type: Object }) change!: SolutionUpdated;

  render() {
    const solution = this.change.solution;
    if (solution?.info) {
      const solutionInfo = parseSolutionInfo(solution.info);
      return html`
        <sl-card>
          <div slot="header">
            <a class="change-card-heading" href="/solution/${solution.id}"
              >${solutionInfo.name || `Solution ${solution.id}`}</a
            >
            <div class="change-card-subheading">has updates ✨</div>
          </div>
          <a class="solution-body" href="/solution/${solution.id}">
            ${solutionInfo.news
              ? html` <vertical-fade class="solution-news"
                  >${formatText(solutionInfo.news)}
                </vertical-fade>`
              : html``}
            <solution-details-bar .solution=${solution}></solution-details-bar>
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
