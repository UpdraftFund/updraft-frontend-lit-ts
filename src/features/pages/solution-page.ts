import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

// Import sub-components
import './solution/components/index'; // Use barrel export

@customElement('solution-page')
export class SolutionPage extends LitElement {
  @property({ type: String })
  solutionId?: string;

  render() {
    if (!this.solutionId) {
      // TODO: Handle case where solutionId is missing more gracefully
      return html` <p>Solution not found or ID missing.</p> `;
    }

    return html`
      <div class="solution-content container mx-auto px-4 py-8">
        <!-- Solution Header -->
        <solution-header .solutionId=${this.solutionId}></solution-header>

        <!-- Solution Tabs -->
        <solution-tabs .solutionId=${this.solutionId}></solution-tabs>
      </div>
    `;
  }

  // Optional: Prevent Lit from creating a shadow DOM
  // createRenderRoot() {
  //   return this;
  // }
}

declare global {
  interface HTMLElementTagNameMap {
    'solution-page': SolutionPage;
  }
}
