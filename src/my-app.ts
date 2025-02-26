import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Router } from '@lit-labs/router';
import { Task } from '@lit/task';
import { getBalance } from '@wagmi/core'
import { formatUnits, fromHex } from 'viem';
import makeBlockie from 'ethereum-blockies-base64';

import '@shoelace-style/shoelace/dist/themes/light.css';
import '@styles/reset.css';
import '@styles/global.css';
import '@styles/theme.css';

import { modal, config } from '@/web3';

import { user, connectionContext, balanceContext, RequestBalanceRefresh, updraftSettings } from '@/context';
import { Connection, Balances, UpdraftSettings } from '@/types';

import urqlClient from '@/urql-client';
import { ProfileDocument } from '@gql';
import { updraft } from "@contracts/updraft.ts";

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
      path: '/discover',
      enter: async () => {
        await import('./pages/discover-page');
        return true;
      },
      render: () => {
        const params = new URLSearchParams(window.location.search);
        const search = params.get('search');
        const tab = params.get('tab') || (search ? 'search' : null);
        return html`<discover-page .search=${search} .tab=${tab}></discover-page>`
      }
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
    {
      path: '/create-solution/:ideaId',
      enter: async () => {
        await import('./pages/create-solution');
        return true;
      },
      render: ({ ideaId }) => {
        if (!ideaId) {
          return html`
            <div>No idea id</div>`
        }
        return html`
          <create-solution .ideaId=${ideaId}></create-solution>`
      }
    },
  ]);

  @provide({ context: connectionContext }) connection: Connection = { connected: false };
  @provide({ context: balanceContext }) balances: Balances = {};
  @provide({ context: updraftSettings }) updraftSettings!: UpdraftSettings;

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
        }
      };
      this.getUpdraftSettings.run().then(() =>
        this.refreshBalances.run());
    });

    this.addEventListener(RequestBalanceRefresh.type, () => this.refreshBalances.run());
  }

  public refreshBalances = new Task(this, {
    task: async () => {
      if (this.connection.address) {
        const gasToken = await getBalance(config, { address: this.connection.address });
        const updraftToken = await getBalance(config, {
          address: this.connection.address,
          token: this.updraftSettings.updAddress,
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

  public getUpdraftSettings = new Task(this, {
    task: async () => {
      const percentScaleBigInt = await updraft.read('percentScale') as bigint;
      const minFee = await updraft.read('minFee') as bigint;
      const percentFee = await updraft.read('percentFee') as bigint;
      const percentScale = Number(percentScaleBigInt);
      const updAddress = await updraft.read('feeToken') as `0x${string}`;
      this.updraftSettings = {
        percentScale,
        updAddress,
        percentFee: Number(percentFee) / percentScale,
        minFee: Number(formatUnits(minFee, 18)),
      };
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
