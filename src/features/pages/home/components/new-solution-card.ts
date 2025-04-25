import { customElement } from 'lit/decorators.js';
import { html } from 'lit';
import { css } from 'lit';
import { NewSolution } from '@pages/home/types';
import { TrackedChangeCard } from './tracked-change-card';

@customElement('new-solution-card')
export class NewSolutionCard extends TrackedChangeCard {
  static styles = [
    ...TrackedChangeCard.styles,
    css`
      /* Additional styles specific to this card */
    `,
  ];

  // Type checking for the change property
  declare change: NewSolution;

  render() {
    const solution = this.change.solution;

    return html`
      <sl-card>
        <div slot="header">
          <h3 class="change-card-title">${this.change.idea?.name}</h3>
          <div class="change-card-byline">
            New solution by ${solution?.id || 'anonymous'}
          </div>
        </div>

        ${solution?.info
          ? html` <div class="solution-info">${solution.info}</div> `
          : ''}
        ${solution ? this.renderSolutionDetails(solution) : ''}
      </sl-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'new-solution-card': NewSolutionCard;
  }
}
