import { customElement } from "lit/decorators.js";
import { css, html, LitElement } from "lit";

@customElement('left-side-bar')
export class LeftSideBar extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background-color: #f4f4f4; /* Light gray placeholder */
      border-right: 1px solid #ccc;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    p {
      font-size: 1rem;
      color: gray;
      text-align: center;
      margin: 0;
    }
  `;

  render() {
    return html`
      <p>Left Sidebar Placeholder</p>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'left-side-bar': LeftSideBar;
  }
}