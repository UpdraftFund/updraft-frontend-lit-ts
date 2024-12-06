import { customElement } from 'lit/decorators.js';
import { css, html } from 'lit';
import { LitComponent } from '../../litComponent';


@customElement('app-overall-section')
export class AppOverallSection extends LitComponent {
  static styles = css`
    :host {
      display: block;
    }

    .overall-section {
      display: flex;
      gap: 12px;
    }

    .overall-section > * {
      min-width: 190px;
    }
  `;

  render() {
    return html`
      <div class="overall-section">
        <app-overall-card value="10" title="Drafted Ideas" variant="blue"></app-overall-card>
        <app-overall-card value="10" title="Supported Ideas" variant="blue"></app-overall-card>
        <app-overall-card value="10" title="Drafted Solution" variant="radishical"></app-overall-card>
        <app-overall-card value="10" title="Funded Solution" variant="radishical"></app-overall-card>
        <app-overall-card value="10" title="UPD Earned" variant="golden"></app-overall-card>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-overall-section': AppOverallSection;
  }
}