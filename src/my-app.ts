import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Router } from '@lit-labs/router';

import makeBlockie from 'ethereum-blockies-base64';
import { getBalance } from '@wagmi/core'

import './styles/reset.css';
import '@shoelace-style/shoelace/dist/themes/light.css';
import './styles/global.css';
import './styles/theme.css';

import { modal, config } from './web3';
import { User, userContext, Balances, balanceContext, RequestBalanceRefresh } from './context';

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
      render: () => html`
        <components-preview></components-preview>`
    },
    {
      path: '/',
      enter: async () => {
        await import('./pages/home-page');
        return true;
      },
      render: () => html`
        <home-page></home-page>`
    },
    {
      path: '/idea/:id',
      enter: async () => {
        await import('./pages/idea-page');
        return true;
      },
      render: ({ id }) => html`
        <idea-page .ideaId=${id}></idea-page>`
    },
  ]);

  @provide({ context: userContext }) user: User = { connected: false };
  @provide({ context: balanceContext }) balances: Balances = {};

  constructor() {
    super();
    modal.subscribeAccount(({ isConnected, address }) => {
      // TODO: get and parse updraft profile from address
      this.user = {
        ...this.user,
        connected: isConnected,
        address: address ? address as `0x${string}` : this.user.address,
        avatar: !this.user.avatar && address ? makeBlockie(address) : this.user.avatar,
      };
    });
    modal.subscribeNetwork(({ caipNetwork }) => {
      this.user = {
        ...this.user,
        network: {
          name: caipNetwork?.name,
          id: Number(caipNetwork?.id),
        }
      };
    });
    this.addEventListener(RequestBalanceRefresh.type, () => this.refreshBalances());
  }

  async refreshBalances() {
    if (this.user.address) {
      const token = await getBalance(config, { address: this.user.address });
      this.balances = {
        ...this.balances,
        [token.symbol]: token.formatted
      }
    }
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
