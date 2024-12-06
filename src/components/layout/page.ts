import { customElement } from "lit/decorators.js";
import { LitComponent } from "../litComponent";
import { css, html } from "lit";




@customElement('app-page')
export class AppPage extends LitComponent {

  static styles = css`
    :host {
      display: flex;
      align-self: stretch;
      flex-direction: column;
      align-items: center;
      overflow: hidden;
    }
    
  `;

  render() {
    return html`
        <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-page': AppPage;
  }
}