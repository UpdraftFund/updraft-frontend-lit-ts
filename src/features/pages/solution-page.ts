import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@/features/layout/app-layout'; // Ensure layout is loaded

// Import sub-components
import './solution/components/index'; // Use barrel export

@customElement('solution-page')
export class SolutionPage extends LitElement {
  @property({ type: String })
  solutionId?: string;

  render() {
    if (!this.solutionId) {
      // TODO: Handle case where solutionId is missing more gracefully
      return html`
        <app-layout>
          <p>Solution not found or ID missing.</p>
        </app-layout>
      `;
    }

    return html`
      <app-layout>
        <div class="solution-content container mx-auto px-4 py-8">
          <!-- Solution Header -->
          <solution-header .solutionId=${this.solutionId}></solution-header>

          <!-- Solution Tabs -->
          <solution-tabs .solutionId=${this.solutionId}></solution-tabs>
        </div>
      </app-layout>
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
