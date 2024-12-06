import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { LitComponent } from "../litComponent";

@customElement('app-icon')
export class AppIcon extends LitComponent {

  @property({ type: String })
  name = '';

  @property({ type: String })
  width = '25px';

  @property({ type: String })
  height = '26px';

  static styles = css`
    :host {
      display: inline-block;
      line-height: 0;
    }
  `;


  render() {
    return html`
      <img src=${`/assets/icons/${this.name}.svg`} alt=${this.name} width=${this.width} height=${this.height} />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-icon': AppIcon;
  }
}