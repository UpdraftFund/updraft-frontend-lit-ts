import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('solution-overview')
export class SolutionOverview extends LitElement {
  @property({ type: String })
  solutionId?: string;

  render() {
    return html`
      <div>
        <h3>Overview</h3>
        <p>
          Details about the solution (ID: ${this.solutionId}) will go here. This
          includes the main description, perhaps linked documents, and key
          metrics.
        </p>
        <!-- TODO: Add Solution Description, Funding Status/Progress, Links -->
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'solution-overview': SolutionOverview;
  }
}
