import { customElement, property } from "lit/decorators.js";
import { LitElement, html, css } from "lit";

@customElement('app-overall-card')
export class AppOverallCard extends LitElement {
  @property({ type: String })
  value: string = '';

  @property({ type: String })
  title: string = '';

  @property({ type: String })
  variant: 'blue' | 'radishical' | 'golden' = 'blue';


  static styles = css`
    :host {
      display: inline-block;
    }

    .overall-card {
      border-radius: 12px;
      padding: 12px 24px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: center;
    }

    .overall-card-value {
      font-size: 32px;
      font-weight: bold;
      color: var(--mako-1000);
    }

    .overall-card-title {
      font-size: 20px;
      color: var(--mako-800);
    }
    
    .overall-card.blue {
      background: var(--dimond-river-gradient);
    }

    .overall-card.radishical {
      background: var(--dimond-radishical-gradient);
    }

    .overall-card.golden {
      background: var(--dimond-golden-gradient);
    }
  `;

  render() {
    return html`
      <div class="overall-card ${this.variant}">
        <p class="overall-card-value">${this.value}</p>
        <p class="overall-card-title">${this.title}</p>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-overall-card': AppOverallCard;
  }
}