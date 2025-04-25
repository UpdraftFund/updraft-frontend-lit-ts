import { customElement } from 'lit/decorators.js';
import { html } from 'lit';
import { css } from 'lit';
import { NewFunders } from '@pages/home/types';
import { TrackedChangeCard } from './tracked-change-card';

@customElement('new-funders-card')
export class NewFundersCard extends TrackedChangeCard {
  static styles = [
    ...TrackedChangeCard.styles,
    css`
      /* Additional styles specific to this card */
    `,
  ];

  // Type checking for the change property
  declare change: NewFunders;

  render() {
    const solution = this.change.solution;
    const funders = this.change.funders || [];
    const additionalCount = this.change.additionalCount || 0;

    return html`
      <sl-card>
        <div slot="header">
          <h3 class="change-card-title">${solution?.info || 'Solution'}</h3>
          <div class="change-card-byline">Received new funding</div>
        </div>

        <div class="person-list">
          ${funders.map(
            (funder) => html`
              <div class="person-item">
                <span>${funder.id}</span>
              </div>
            `
          )}
          ${additionalCount > 0
            ? html`
                <div class="additional-count">and ${additionalCount} more</div>
              `
            : ''}
        </div>

        ${solution ? this.renderSolutionDetails(solution) : ''}
      </sl-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'new-funders-card': NewFundersCard;
  }
}
