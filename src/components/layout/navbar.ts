import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('app-navbar')
export class AppNavbar extends LitElement {
  @state()
  private currentPath = '';

  connectedCallback() {
    super.connectedCallback();
    this.currentPath = window.location.pathname;
    
    // Update currentPath when navigation occurs
    window.addEventListener('popstate', () => {
      this.currentPath = window.location.pathname;
    });
  }

  static styles = css`
    :host {
      display: block;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: var(--white);
      padding: 12px 32px;
    }

    nav {
      display: flex;
      width: 100%;
      justify-content: space-between;
      align-items: center;
    }

    nav > * {
      flex: 1;
    }

    .logo {
      display: flex;
      align-items: center;
    }

    .logo img {
      height: 50px;
    }

    .nav-links {
      display: flex;
      gap: 2rem;
      align-items: center;
      justify-content: center;
    }

    .actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
    }
  `;

  render() {
    return html`
      <nav>
        <div class="logo">
          <img src="/logo/updraft-512.png" alt="Logo" />
        </div>

        <div class="nav-links">
          <app-link href="/" variant="primary" ?active=${this.currentPath === '/'}>
            Home
          </app-link>
          <app-link href="/ideas" variant="primary" ?active=${this.currentPath === '/ideas'}>
            Ideas
          </app-link>
          <app-link href="/solutions" variant="primary" ?active=${this.currentPath === '/solutions'}>
            Solutions
          </app-link>
        </div>

        <div class="actions">
          <app-button variant="primary" size="sm">Connect Wallet</app-button>
        </div>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-navbar': AppNavbar;
  }
}
