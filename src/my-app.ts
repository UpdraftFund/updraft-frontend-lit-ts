import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Router } from '@lit-labs/router';
import { Task } from '@lit/task';
import { getBalance } from '@wagmi/core'
import { fromHex } from 'viem';
import makeBlockie from 'ethereum-blockies-base64';

import '@shoelace-style/shoelace/dist/themes/light.css';
import '@styles/reset.css';
import '@styles/global.css';
import '@styles/theme.css';

import { modal, config } from '@/web3';
import updAddresses from '@/contracts/updAddresses.json';

import { user, connectionContext, balanceContext, RequestBalanceRefresh } from '@/context';
import { Connection, Balances } from '@/types';

import urqlClient from '@/urql-client';
import { ProfileDocument } from '@gql';

// @ts-ignore: Property 'UrlPattern' does not exist
if (!globalThis.URLPattern) {
  await import('urlpattern-polyfill');
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
    {
      path: '/submit-profile-and-create-:entity',
      enter: async () => {
        await import('./pages/edit-profile');
        return true;
      },
      render: ({ entity }) => html`
        <edit-profile .entity=${entity}></edit-profile>`
    },
    {
      path: '/profile/:address',
      enter: async () => {
        await import('./pages/view-profile');
        return true;
      },
      render: ({ address }) => html`
        <view-profile .address=${address}></view-profile>`
    },
  ]);

  @provide({ context: connectionContext }) connection: Connection = { connected: false };
  @provide({ context: balanceContext }) balances: Balances = {};

  constructor() {
    super();
    modal.subscribeAccount(async ({ isConnected, address }) => {
      if (address) {
        this.connection.address = address as `0x${string}`;
        const result = await urqlClient.query(ProfileDocument, { userId: address });
        let profile = {} as { name: string, team: string, image: string };
        if (result.data?.user?.profile) {
          profile = JSON.parse(fromHex(result.data.user.profile as `0x${string}`, 'string'));
        }
        user.set({
          name: profile.name || profile.team || address,
          image: profile.image,
          avatar: profile.image || makeBlockie(address),
        });
      }
      this.connection = {
        ...this.connection,
        connected: isConnected,
      };
    });
    modal.subscribeNetwork(({ caipNetwork }) => {
      this.connection = {
        ...this.connection,
        network: {
          name: caipNetwork!.name,
          id: caipNetwork!.caipNetworkId as keyof typeof updAddresses,
        }
      };
      this.refreshBalances.run();
    });
    this.addEventListener(RequestBalanceRefresh.type, () => this.refreshBalances.run());
  }

  public refreshBalances = new Task(this, {
    task: async () => {
      if (this.connection.address && this.connection.network?.id) {
        const gasToken = await getBalance(config, { address: this.connection.address });
        const updraftToken = await getBalance(config, {
          address: this.connection.address,
          token: updAddresses[this.connection.network.id]?.address as `0x{$string}`,
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
