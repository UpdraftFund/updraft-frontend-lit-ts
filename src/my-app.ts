import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Router } from '@lit-labs/router';

import makeBlockie from 'ethereum-blockies-base64';

import './styles/reset.css';
import '@shoelace-style/shoelace/dist/themes/light.css';
import './styles/global.css';
import './styles/theme.css';

import { modal } from './web3';
import { User, userContext } from './user-context';

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
        await import('./pages/home-page');
        return true;
      },
      render: () => html`<home-page></home-page>`
    },
    {
      path: '/idea/:id',
      enter: async () => {
        await import('./pages/idea-page');
        return true;
      },
      render: ({ id }) => html`<idea-page .ideaId=${id}></idea-page>`
    },
  ]);

  @provide({ context: userContext }) user: User = { connected: false };

  constructor() {
    super();
    modal.subscribeAccount(({ isConnected, address }) => {
      this.user = {
        ...this.user,
        connected: isConnected,
        address: address ? address as `0x${string}` : this.user.address,
        avatar: !this.user.avatar && address ? makeBlockie(address) : this.user.avatar,
      };
    });
  }

  render() {
    return html`
      ${this.router.outlet()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-app': MyApp;
  }
}
