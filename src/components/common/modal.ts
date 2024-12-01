import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('app-modal')
export class AppModal extends LitElement {

  @property({ type: Boolean })
  isOpen = false;

  @property({ type: Boolean })
  hasCloseButton = true;

  @property({ type: String })
  title = '';

  static styles = css`
    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(87, 87, 87, 0.25);
      backdrop-filter: blur(4px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: #ffffff;
      border-radius: 18px;
      padding: 25px 32px 28px;
      position: relative;
      min-width: clamp(300px, 100%, 550px);
    }

    .modal-content-title {
      font-size: 20px;
      margin-bottom: 32px;
      font-weight: 600;
      color: var(--miko-900);
    }

    .close-button {
      position: absolute;
      top: -40px;
      right: 0px;
      width: 32px;
      height: 32px;

      display: flex;
      justify-content: center;
      align-items: center;

      background: #ffffff;
      border-radius: 50%;

      cursor: pointer;
    }
  `;

  render() {
    if (!this.isOpen) return null;

    return html`
      <div class="modal" @click=${this._dispatchClose}>
        <div class="modal-content" @click=${(event: MouseEvent) => event.stopPropagation()}>
          <div class="modal-content-title">${this.title}</div>
          <slot></slot>

          ${this.hasCloseButton ? html`
              <span class="close-button" @click=${this._dispatchClose}>
                <app-icon name="xmark" width="12" height="16"></app-icon>
              </span>
              ` : null}

        </div>
      </div>
    `;
  }

  private _dispatchClose() {
    this.dispatchEvent(new CustomEvent('close'));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-modal': AppModal;
  }
}