import { customElement, property } from "lit/decorators.js";
import { LitComponent } from "../components/litComponent";
import { html } from "lit";

@customElement('idea-page')
export class IdeaPage extends LitComponent {
  @property()
  ideaId?: string;

  render() {
    return html`
      <div class="idea-page">
        <p>Idea ID: ${this.ideaId}</p>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'idea-page': IdeaPage;
  }
}
