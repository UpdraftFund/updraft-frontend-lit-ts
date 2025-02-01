import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Router } from '@lit-labs/router';
import { Task } from '@lit/task';

import makeBlockie from 'ethereum-blockies-base64';
import { getBalance } from '@wagmi/core'

import './styles/reset.css';
import '@shoelace-style/shoelace/dist/themes/light.css';
import './styles/global.css';
import './styles/theme.css';

import { modal, config } from './web3';
import { User, userContext, Balances, balanceContext, RequestBalanceRefresh } from './context';
import updAddresses from './contracts/updAddresses.json';

// @ts-ignore: Property 'UrlPattern' does not exist
if (!globalThis.URLPattern) {
  await import("urlpattern-polyfill");
}

@customElement('my-app')
export class MyApp extends LitElement {

  private router = new Router(this, [
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
    {
      path: '/create-idea',
      enter: async () => {
        await import('./pages/create-idea');
        return true;
      },
      render: () => html`
        <create-idea></create-idea>`
    },
    {
      path: '/edit-profile',
      enter: async () => {
        await import('./pages/edit-profile');
        return true;
      },
      render: () => html`
        <edit-profile></edit-profile>`
    },
  ]);

  @provide({ context: userContext }) user: User = { connected: false };
  @provide({ context: balanceContext }) balances: Balances = {};

  constructor() {
    super();
    modal.subscribeAccount(({ isConnected, address }) => {
      // TODO: get and parse updraft profile from address
      if (address){
        this.user.address = address as `0x${string}`;
        this.user.avatar = this.user.image || makeBlockie(address);
      }
      this.user = {
        ...this.user,
        connected: isConnected,
      };
    });
    modal.subscribeNetwork(({ caipNetwork }) => {
      // console.log('caipNetwork');
      // console.dir(caipNetwork);
      this.user = {
        ...this.user,
        network: {
          name: caipNetwork?.name,
          id: caipNetwork?.caipNetworkId as keyof typeof updAddresses,
        }
      };
      this.refreshBalances.run();
    });
    this.addEventListener(RequestBalanceRefresh.type, () => this.refreshBalances.run());
  }

  public refreshBalances = new Task(this, {
    task: async () => {
      if (this.user.address && this.user.network?.id) {
        const gasToken = await getBalance(config, { address: this.user.address });
        const updraftToken = await getBalance(config, {
          address: this.user.address,
          token: updAddresses[this.user.network.id]?.address as `0x{$string}`,
        });
        this.balances = {
          gas: {
            symbol: gasToken.symbol,
            balance: gasToken.formatted,
          },
          updraft: {
            symbol: updraftToken.symbol,
            balance: updraftToken.formatted,
          }
        }
      }
    },
    autoRun: false,
  });

  render = () => this.router.outlet();
}

declare global {
  interface HTMLElementTagNameMap {
    'my-app': MyApp;
  }
}
