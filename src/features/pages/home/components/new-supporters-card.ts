import { customElement } from 'lit/decorators.js';
import { html } from 'lit';
import { NewSupporters } from '@pages/home/types';
import { TrackedChangeCard } from './tracked-change-card';

@customElement('new-supporters-card')
export class NewSupportersCard extends TrackedChangeCard {
  // We can add additional specific styles if needed
  static styles = [
    ...TrackedChangeCard.styles,
    css`
      /* Add any additional specific styles here */
    `,
  ];

  // Type checking for the change property
  declare change: NewSupporters;

  render() {
    const supporters = this.change.supporters || [];
    const additionalCount = this.change.additionalCount || 0;

    return html`
      <sl-card>
        <div slot="header">
          <h3 class="change-card-title">${this.change.idea?.name}</h3>
          <div class="change-card-byline">Received new support</div>
        </div>

        <div class="person-list">
          ${supporters.map(
            (supporter) => html`
              <div class="person-item">
                <span>${supporter.id}</span>
              </div>
            `
          )}
          ${additionalCount > 0
            ? html`
                <div class="additional-count">and ${additionalCount} more</div>
              `
            : ''}
        </div>
      </sl-card>
    `;
  }
}

// Register the component
declare global {
  interface HTMLElementTagNameMap {
    'new-supporters-card': NewSupportersCard;
  }
}

// Import these at the top of the file
import { css } from 'lit';
