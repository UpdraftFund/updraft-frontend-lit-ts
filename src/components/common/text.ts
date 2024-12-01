import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { theme } from '../../styles/theme';
import { LitComponent } from '../litComponent';

@customElement('app-text')
export class AppText extends LitComponent {
  @property()
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label' = 'body';

  @property()
  weight: 'regular' | 'medium' | 'bold' = 'regular';

  @property()
  color: 'primary' | 'secondary' | 'default' = 'default';

  static styles = [
    theme,
    css`
      /* Base styles */
      :host {
        display: block;
      }

      /* Variants */
      .h1 {
        font-size: var(--font-size-h1, 2.5rem);
        line-height: 1.2;
        margin-bottom: var(--spacing-lg);
      }

      .h2 {
        font-size: var(--font-size-h2, 2rem);
        line-height: 1.3;
        margin-bottom: var(--spacing-md);
      }

      .h3 {
        font-size: var(--font-size-h3, 1.75rem);
        line-height: 1.4;
        margin-bottom: var(--spacing-sm);
      }

      .h4 {
        font-size: var(--font-size-h4, 1.5rem);
        line-height: 1.4;
        margin-bottom: var(--spacing-sm);
      }

      .body {
        font-size: var(--font-size-md, 1rem);
        line-height: 1.5;
        margin-bottom: var(--spacing-sm);
      }

      .caption {
        font-size: var(--font-size-sm, 0.875rem);
        line-height: 1.5;
        margin-bottom: var(--spacing-xs);
      }

      .label {
        font-size: var(--font-size-sm, 0.875rem);
        line-height: 1.4;
        font-weight: 500;
      }

      /* Weights */
      .regular {
        font-weight: 400;
      }

      .medium {
        font-weight: 500;
      }

      .bold {
        font-weight: 700;
      }

      /* Colors */
      .color-default {
        color: var(--color-text);
      }

      .color-primary {
        color: var(--color-primary);
      }

      .color-secondary {
        color: var(--color-secondary);
      }
    `
  ];

  render() {
    return html`
      <div class="${this.variant} ${this.weight} color-${this.color}">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-text': AppText;
  }
} 