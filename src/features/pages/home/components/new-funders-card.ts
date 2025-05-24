import { customElement } from 'lit/decorators.js';
import { html, css, LitElement } from 'lit';
import { fromHex } from 'viem';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

import { NewFunders } from '@pages/home/types';
import { SolutionInfo } from '@/features/solution/types';
import { shortenAddress } from '@utils/format-utils';
import { changeCardStyles } from '@styles/change-card-styles';

@customElement('new-funders-card')
export class NewFundersCard extends LitElement {
  static styles = [
    changeCardStyles,
    css`
      .funders {
        font-size: 0.85rem;
        text-overflow: ellipsis;
        overflow: hidden;
      }
    `,
  ];

  // Type checking for the change property
  declare change: NewFunders;

  render() {
    const solution = this.change.solution;
    const funders = this.change.funders || [];
    const additionalCount = this.change.additionalCount || 0;

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
          <a href="/solution/${solution.id}" class="change-card-heading">
            ${solutionInfo?.name || 'Solution'}
          </a>
          <div class="change-card-subheading">Received new funding</div>
        </div>

        <div class="funders">
          ${funders.map(
            (funder, index) => html`
              ${funder.name
                ? html`<a href="/profile/${funder.id}">${funder.name}</a>`
                : html`<a class="id" href="/profile/${funder.id}"
                    >${shortenAddress(funder.id)}</a
                  >`}${index < funders.length - 1 ? html`, ` : html``}
            `
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
