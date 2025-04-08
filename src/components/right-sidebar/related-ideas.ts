import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import '@components/shared/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

@customElement('related-ideas')
export class RelatedIdeas extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    h2 {
      margin-top: 0;
      font-size: 1.25rem;
    }

    .related-ideas-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .no-ideas {
      color: var(--sl-color-neutral-500);
      font-style: italic;
    }

    .debug-info {
      font-size: 0.8rem;
      color: var(--sl-color-neutral-400);
      margin-top: 0.5rem;
      font-style: italic;
    }
  `;

  @property({ type: String })
  ideaId = '';

  render() {
    return html`
      <div>
        <h2>Related Ideas</h2>
      </div>
    `;
  }
}
