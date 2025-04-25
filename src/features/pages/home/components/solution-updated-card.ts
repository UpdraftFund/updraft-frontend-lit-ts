import { customElement } from 'lit/decorators.js';
import { html } from 'lit';
import { css } from 'lit';
import { SolutionUpdated } from '@pages/home/types';
import { TrackedChangeCard } from './tracked-change-card';

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

    return html`
      <sl-card>
        <div slot="header">
          <h3 class="change-card-title">Solution Updated</h3>
          <div class="change-card-byline">
            by ${solution?.id || 'anonymous'}
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
    'solution-updated-card': SolutionUpdatedCard;
  }
}
