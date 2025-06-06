import { customElement } from 'lit/decorators.js';
import { html, css, LitElement } from 'lit';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import { NewFunders } from '@pages/home/types';
import { parseSolutionInfo } from '@utils/solution/solution-utils';
import { changeCardStyles } from '@styles/change-card-styles';

@customElement('new-funders-card')
export class NewFundersCard extends LitElement {
  static styles = [
    changeCardStyles,
    css`
      .funders {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        align-items: center;
      }

      .funders a {
        font-size: 0.85rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 11rem;
      }
    `,
  ];

  // Type checking for the change property
  declare change: NewFunders;

  render() {
    const solution = this.change.solution;
    const funders = this.change.funders || [];
    const additionalCount = this.change.additionalCount || 0;
    const solutionInfo = parseSolutionInfo(solution?.info);

    return html`
      <sl-card>
        <div slot="header">
          <a href="/solution/${solution.id}" class="change-card-heading">
            ${solutionInfo?.name || 'Solution'}
          </a>
          <div class="change-card-subheading">Received new funding</div>
        </div>

        <div class="funders">
          ${funders.map(
            (funder, index) =>
              html`<a href="/profile/${funder.id}">${funder.name}</a>
                ${index < funders.length - 1 ? html`, ` : html``} `
          )}
          ${additionalCount > 0
            ? html`
                <div class="additional-count">
                  and ${additionalCount} others
                </div>
              `
            : ''}
        </div>

        <div slot="footer">${dayjs(this.change.time).fromNow()}</div>
      </sl-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'new-funders-card': NewFundersCard;
  }
}
