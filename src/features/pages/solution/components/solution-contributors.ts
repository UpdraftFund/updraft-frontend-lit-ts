import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('solution-contributors')
export class SolutionContributors extends LitElement {
  @property({ type: String })
  solutionId?: string;

  render() {
    return html`
      <div>
        <h3>Contributors</h3>
        <p>
          List of contributors/funders for solution ID: ${this.solutionId} will
          appear here.
        </p>
        <!-- TODO: Fetch and display contributors list -->
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'solution-contributors': SolutionContributors;
  }
}
