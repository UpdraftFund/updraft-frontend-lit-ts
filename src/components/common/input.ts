import { customElement, property } from "lit/decorators.js";
import { LitComponent } from "../litComponent";
import { css, html } from "lit";



@customElement('app-input')
export class AppInput extends LitComponent {
  @property()
  label = '';

  @property()
  value = '';

  @property()
  placeholder = '';

  @property({ type: Boolean })
  error = false;

  @property()
  errorMessage = '';

  @property()
  type: 'text' | 'email' | 'password' = 'text';

  @property({ type: Boolean })
  disabled = false;

  static styles = css`
    :host {
      display: block;
    }

    .label {
      font-size: 14px;
      color: var(--mako-700);
      margin-bottom: 4px;
    }

    input {
      width: 100%;
      padding: 12px 16px;
      border-radius: 12px;
      border: 1px solid var(--light-gray);
      font-size: 16px;
      color: var(--mako-900);
    }

    input:focus {
      outline: none;
      border-color: var(--river-blue-400);
    }

    input::placeholder {
      color: var(--mako-500);
    }
  `;

  render() {
    return html`
      <p class="label">${this.label}</p>
      <input 
        type=${this.type} 
        .value=${this.value} 
        placeholder=${this.placeholder} 
        ?error=${this.error}
        ?disabled=${this.disabled}
        @input=${this._handleInput}
      />
    `;
  }

  private _handleInput(event: InputEvent) {
    this.value = (event.target as HTMLInputElement).value;
  }
}


declare global {
  interface HTMLElementTagNameMap {
    'app-input': AppInput;
  }
}
