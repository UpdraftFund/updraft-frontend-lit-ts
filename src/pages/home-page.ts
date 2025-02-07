import { customElement } from "lit/decorators.js";
import { css, html, LitElement } from "lit";

import '../components/layout/top-bar'

@customElement('home-page')
export class HomePage extends LitElement {

  static styles = css`
  `;

  render() {
    return html`
      <top-bar></top-bar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
