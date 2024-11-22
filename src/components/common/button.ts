import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('app-button')
export class AppButton extends LitElement {
  @property()
  label = '';

  @property()
  variant: 'primary' | 'secondary' = 'primary';

  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      border-radius: 8px;
      border: 1px solid transparent;
      padding: 0.6em 1.2em;
      font-size: 1em;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: border-color 0.25s;
    }

    button.primary {
      background-color: #646cff;
      color: white;
    }

    button.secondary {
      background-color: transparent;
      border-color: #646cff;
      color: #646cff;
    }
  `;

  render() {
    return html`
      <button class=${this.variant}>
        ${this.label}
        <slot></slot>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-button': AppButton;
  }
}