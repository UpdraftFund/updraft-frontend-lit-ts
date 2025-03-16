// Mock for the idea-card-small component
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('idea-card-small')
export class IdeaCardSmall extends LitElement {
  render() {
    return html`<div class="idea-card-small">Mocked Idea Card Small</div>`;
  }
}
