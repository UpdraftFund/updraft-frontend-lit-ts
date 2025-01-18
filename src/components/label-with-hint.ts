import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

@customElement('label-with-hint')
export class LabelWithHint extends LitElement {
  @property({ type: String, reflect: true }) label!: string;
  @property({ type: String, reflect: true }) hint!: string;

  static styles = css`
    :host {
      display: inline-block;
    }

    .label {
      font-weight: bold;
      font-size: 1rem;
      margin-bottom: 0.15rem;
      color: var(--main-foreground);
    }

    .hint {
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      color: var(--hint-text);
    }
  `;

  render() {
    return html`
      <div class="label">${this.label}</div>
      <div class="hint">${this.hint}</div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'label-with-hint': LabelWithHint;
  }
}