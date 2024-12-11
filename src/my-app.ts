import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';

import { theme } from './styles/theme';

import './components/index.ts';
import './pages/components-preview';
import './pages/home';
import './pages/idea';
import './components/layout/navbar';

// @ts-ignore: Property 'UrlPattern' does not exist
if (!globalThis.URLPattern) {
  await import("urlpattern-polyfill");
}

@customElement('my-app')
export class MyApp extends LitElement {
  static styles = [
    theme,
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
      }
    `
  ];

  private router = new Router(this, [
    {
      path: '/__components__',
      render: () => html`<components-preview />`
    },
    {
      path: '/',
      render: () => html`<app-home-page />`
    },
    {
      path: '/idea/:id',
      render: ({ id }) => {
        console.log(`ID is ${id}`);
        return html`<idea-page .ideaId=${id} />`
      }
    },
  ]);

  render() {
    return html`
      <app-navbar></app-navbar>
      <app-page>  
        ${this.router.outlet()}
      </app-page>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-app': MyApp;
  }
}
