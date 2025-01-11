import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';

import './styles/reset.css';
import './styles/global.css';
import './styles/theme.css';

import './components/layout/app-layout'

// @ts-ignore: Property 'UrlPattern' does not exist
if (!globalThis.URLPattern) {
  await import("urlpattern-polyfill");
}

@customElement('my-app')
export class MyApp extends LitElement {

  private router = new Router(this, [
    {
      path: '/__components__',
      enter: async () => {
        await import('./pages/components-preview');
        return true;
      },
      render: () => html`<components-preview></components-preview>`
    },
    {
      path: '/',
      enter: async () => {
        await import('./pages/home');
        return true;
      },
      render: () => html`<app-home-page></app-home-page>`
    },
    {
      path: '/idea/:id',
      enter: async () => {
        await import('./pages/idea');
        return true;
      },
      render: ({ id }) => html`<idea-page .ideaId=${id}></idea-page>`
    },
  ]);

  render() {
    return html`
      <app-layout>
        ${this.router.outlet()}
      </app-layout>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-app': MyApp;
  }
}
