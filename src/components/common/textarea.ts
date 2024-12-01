import { customElement, property } from "lit/decorators.js";
import { LitComponent } from "../litComponent";
import { html } from "lit";
import { css } from "lit";


@customElement('app-textarea')
export class AppTextarea extends LitComponent {
  @property()
  label = '';

  @property()
  value = '';

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  error = false;

  @property()
  errorMessage = '';

  @property()
  placeholder = '';

  @property({ type: Number })
  rows = 4;

  @property({ type: Number })
  cols = 50;

  @property({ type: Number })
  maxLength = 1000;

  @property({ type: Number })
  minLength = 0;

  static styles = css`
    :host {
      display: block;
    }

    .label {
      font-size: 14px;
      color: var(--mako-700);
      margin-bottom: 4px;
    }

    textarea {
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid var(--light-gray);
      font-size: 16px;
      color: var(--mako-900);
      font-family: unset;
    }

    textarea:focus {
      outline: none;
      border-color: var(--river-blue-400);
    }

    textarea::placeholder {
      color: var(--mako-500);
    }
  `;

  render() {
    return html`
      <p class="label">${this.label}</p>
      <textarea 
        .value=${this.value}
        placeholder=${this.placeholder}
        rows=${this.rows}
        cols=${this.cols}
        maxLength=${this.maxLength}
        minLength=${this.minLength}
        ?disabled=${this.disabled}
        ?error=${this.error}
        errorMessage=${this.errorMessage}
        @input=${this._handleInput}
      ></textarea>
    `;
  }

  private _handleInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this.value = textarea.value;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-textarea': AppTextarea;
  }
}