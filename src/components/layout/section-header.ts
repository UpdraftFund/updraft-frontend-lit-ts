import { customElement, property } from "lit/decorators.js";
import { LitComponent } from "../litComponent";
import { css, html } from "lit";

@customElement('app-section-header')
export class AppSectionHeader extends LitComponent {

  @property({ type: String })
  title: string = '';

  @property({ type: String })
  icon: string = '';

  static styles = css`
    :host {
      display: block;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-header-title {
      font-size: 28px;
      font-weight: 600;
      color: var(--mako-1000);
    }
  `;

  render() {
    return html`
      <div class="section-header">
          <app-icon name="${this.icon}" width="40px" height="40px"></app-icon>
          <p class="section-header-title">${this.title}</p>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-section-header': AppSectionHeader;
  }
}