import { customElement } from "lit/decorators.js";
import { css, html, LitElement } from "lit";

import '../components/layout/top-bar'

@customElement('create-idea')
export class CreateIdea extends LitElement {

  static styles = css`
    top-bar span{
      font-size: 2.25rem;
      font-weight: 600;
      margin-left: clamp(0px, calc((100vw - 670px) * 0.5), 266px);
      white-space: nowrap;
    }
  `;

  render() {
    return html`
      <top-bar hide-create-idea-button><span>Create a new Idea</span></top-bar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'create-idea': CreateIdea;
  }
}