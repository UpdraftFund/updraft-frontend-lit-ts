import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { refreshPage } from '@utils/common/version-check';

/**
 * App Refresh Prompt Component
 * 
 * This component displays a prompt to refresh the application when a new version is detected.
 * It appears as a banner at the top of the page.
 */
@customElement('app-refresh-prompt')
export class AppRefreshPrompt extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background-color: var(--sl-color-primary-600);
      color: white;
      padding: 0.75rem 1rem;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transform: translateY(-100%);
      transition: transform 0.3s ease-in-out;
    }

    :host(.visible) {
      transform: translateY(0);
    }

    .content {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .message {
      flex: 1;
      font-weight: 500;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    button {
      cursor: pointer;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-weight: 500;
      border: none;
      transition: background-color 0.2s;
    }

    .refresh-button {
      background-color: white;
      color: var(--sl-color-primary-700);
    }

    .refresh-button:hover {
      background-color: var(--sl-color-neutral-100);
    }

    .dismiss-button {
      background-color: transparent;
      color: white;
      border: 1px solid white;
    }

    .dismiss-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 768px) {
      .content {
        flex-direction: column;
        gap: 0.5rem;
      }

      .actions {
        width: 100%;
        justify-content: center;
      }
    }
  `;

  private visible = false;

  constructor() {
    super();
    // Listen for the custom event dispatched by the version check service
    window.addEventListener('app-version-updated', () => this.showPrompt());
  }

  connectedCallback() {
    super.connectedCallback();
  }

  private showPrompt() {
    this.classList.add('visible');
  }

  private hidePrompt() {
    this.classList.remove('visible');
  }

  private handleRefresh() {
    refreshPage();
  }

  private handleDismiss() {
    this.hidePrompt();
  }

  render() {
    return html`
      <div class="content">
        <div class="message">
          A new version of Updraft is available. Please refresh to update.
        </div>
        <div class="actions">
          <button class="refresh-button" @click=${this.handleRefresh}>
            Refresh Now
          </button>
          <button class="dismiss-button" @click=${this.handleDismiss}>
            Dismiss
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-refresh-prompt': AppRefreshPrompt;
  }
}
