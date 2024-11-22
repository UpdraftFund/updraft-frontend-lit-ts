import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';

import { theme } from './styles/theme';

import './components/index.ts';
import './pages/components-preview';
import './components/layout/navbar';

@customElement('my-app')
export class MyApp extends LitElement {
  static styles = [
    theme,
    css`
      :host {
        display: block;
        padding-top: 64px;
      }

      main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }
    `
  ];
  
  private router = new Router(this, [
    {
      path: '/__components__',
      render: () => html`<components-preview></components-preview>`
    },
    {
      path: '/',
      render: () => html`
        <main>
          <h1>Home Page</h1>
          <app-button label="Click me"></app-button>
        </main>
      `
    }
  ]);

  render() {
    return html`
      <app-navbar></app-navbar>
      ${this.router.outlet()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-app': MyApp;
  }
}
