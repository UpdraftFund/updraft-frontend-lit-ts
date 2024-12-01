import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { LitComponent } from '../litComponent';

@customElement('app-button')
export class AppButton extends LitComponent {
  @property()
  label = '';

  @property()
  variant: 'primary' = 'primary';

  @property()
  size: 'sm' | 'md' | 'lg' = 'md';

  @property()
  icon: string | null = null;

  static styles = css`
    :host {
      display: inline-block;
    }

    button {
      cursor: pointer;
      border: none;
    }
    
    button.primary {
      background-color: var(--river-blue-600);
      color: var(--white);
    }
    
    button.sm {
      font-size: 1rem;
      padding: 0.5em 1em;
      border-radius: 10px;
    }
    
    button.md {
      font-size: 1.25rem;
      padding: 0.75em 1.25em;
      border-radius: 12px;
    }
    
    button.lg {
      font-size: 1.5rem;
      padding: 1em 1.5em;
      border-radius: 14px;
    }

  `;

  render() {
    return html`
      <button class="${this.variant} ${this.size}">
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