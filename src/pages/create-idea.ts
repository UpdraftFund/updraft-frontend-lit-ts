import { customElement } from "lit/decorators.js";
import { css, html, LitElement } from "lit";

import '../components/layout/top-bar'

@customElement('create-idea')
export class CreateIdea extends LitElement {

  static styles = css`
  `;

  render() {
    return html`
      <top-bar></top-bar>
      <p>foobar</p>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'create-idea': CreateIdea;
  }
}