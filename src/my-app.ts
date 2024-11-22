import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';

import { theme } from './styles/theme';

import './components/index.ts';
import './pages/components-preview';

@customElement('my-app')
export class MyApp extends LitElement {
  static styles = [
    theme
  ];
  
  private router = new Router(this, [
    {
      path: '/__components__',
      render: () => html`<components-preview></components-preview>`
    },
    {
      path: '/',
      render: () => html`
        <h1>Home Page</h1>
        <app-button label="Click me"></app-button>
      `
    }
  ]);

  render() {
    return html`${this.router.outlet()}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-app': MyApp;
  }
}
