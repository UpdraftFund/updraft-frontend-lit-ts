import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js';

// Import tab content components (will be created later)
// import './solution-overview';
// import './solution-discussion';
// import './solution-roadmap';
// import './solution-contributors';

@customElement('solution-tabs')
export class SolutionTabs extends LitElement {
  @property({ type: String })
  solutionId?: string;

  render() {
    return html`
      <sl-tab-group>
        <sl-tab slot="nav" panel="overview">Overview</sl-tab>
        <sl-tab slot="nav" panel="discussion">Discussion</sl-tab>
        <sl-tab slot="nav" panel="roadmap">Roadmap</sl-tab>
        <sl-tab slot="nav" panel="contributors">Contributors</sl-tab>

        <sl-tab-panel name="overview">
          <!-- <solution-overview .solutionId=\${this.solutionId}></solution-overview> -->
          Overview Content Placeholder
        </sl-tab-panel>
        <sl-tab-panel name="discussion">
          <!-- <solution-discussion .solutionId=\${this.solutionId}></solution-discussion> -->
          Discussion Content Placeholder
        </sl-tab-panel>
        <sl-tab-panel name="roadmap">
          <!-- <solution-roadmap .solutionId=\${this.solutionId}></solution-roadmap> -->
          Roadmap Content Placeholder
        </sl-tab-panel>
        <sl-tab-panel name="contributors">
          <!-- <solution-contributors .solutionId=\${this.solutionId}></solution-contributors> -->
          Contributors Content Placeholder
        </sl-tab-panel>
      </sl-tab-group>
    `;
  }

  // createRenderRoot() {
  //   return this;
  // }
}

declare global {
  interface HTMLElementTagNameMap {
    'solution-tabs': SolutionTabs;
  }
}
