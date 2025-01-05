import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';

import './styles/global.css';

import './pages/components-preview';
import './pages/home';
import './pages/idea';

// @ts-ignore: Property 'UrlPattern' does not exist
if (!globalThis.URLPattern) {
  await import("urlpattern-polyfill");
}

@customElement('my-app')
export class MyApp extends LitElement {

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
      render: ({ id }) => html`<idea-page .ideaId=${id} />`
    },
  ]);

  render() {
    return html`
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
