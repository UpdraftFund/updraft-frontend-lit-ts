import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { LitComponent } from "../litComponent";

@customElement('app-icon')
export class Icon extends LitComponent {

  static styles = css`
    :host {
      height: fit-content
    }
  `;

  @property({ type: String })
  name = '';

  @property({ type: String })
  width = '25px';

  @property({ type: String })
  height = '26px';

  render() {
    return html`
      <img src=${`/assets/icons/${this.name}.svg`} alt=${this.name} width=${this.width} height=${this.height} />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-icon': Icon;
  }
}