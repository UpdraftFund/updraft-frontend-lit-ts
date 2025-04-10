import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Task } from '@lit/task';
import { Router } from '@lit-labs/router';
import { getBalance } from '@wagmi/core';
import { formatUnits, fromHex } from 'viem';
import makeBlockie from 'ethereum-blockies-base64';

import '@layout/app-layout';

import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/drawer/drawer.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@/features/common/styles/global.css';
import '@/features/common/styles/theme.css';
import '@/features/common/styles/reset.css';

import { modal, config } from '@/features/common/utils/web3';
import urqlClient from '@/features/common/utils/urql-client';

import {
  user,
  connectionContext,
  balanceContext,
  RequestBalanceRefresh,
  updraftSettings,
} from '@/features/common/state/context';
import { Connection, Balances } from '@/features/user/types/current-user';
import { UpdraftSettings } from '@/features/common/types';
import { Profile } from '@/features/user/types';

import { nav } from '@state/navigation/navigation';

import { ProfileDocument } from '@gql';
import { updraft } from '@contracts/updraft';

import '@/features/layout/components/top-bar';
import '@components/navigation/search-bar';
import '@/features/layout/components/left-side-bar';
import '@/features/layout/components/right-side-bar';
import { setUserProfile } from '@state/user/user';

if (!('URLPattern' in globalThis)) {
  await import('urlpattern-polyfill');
}

@customElement('my-app')
export class MyApp extends LitElement {
  private router = new Router(this, [
    {
      path: '/',
      enter: async () => {
        await import('@pages/home-page');
        nav.set('home');
        return true;
      },
      render: () => html`<home-page></home-page>`,
    },
    {
      path: '/discover',
      enter: async () => {
        await import('@pages/discover-page');
        nav.set('discover');
        return true;
      },
      render: () => {
        const params = new URLSearchParams(window.location.search);
        const search = params.get('search');
        const tab = params.get('tab') || (search ? 'search' : null);
        return html`<discover-page
          .search=${search}
          .tab=${tab}
        ></discover-page>`;
      },
    },
    {
      path: '/idea/:id',
      enter: async () => {
        await import('@pages/idea-page');
        nav.set('idea');
        return true;
      },
      render: ({ id }) =>
        html` <idea-page .ideaId=${id as string}></idea-page>`,
    },
    {
      path: '/create-idea',
      enter: async () => {
        await import('@pages/create-idea');
        nav.set('create-idea');
        return true;
      },
      render: () => html`<create-idea></create-idea>`,
    },
    {
      path: '/edit-profile',
      enter: async () => {
        await import('@pages/edit-profile');
        nav.set('edit-profile');
        return true;
      },
      render: () => html`<edit-profile></edit-profile>`,
    },
    {
      path: '/submit-profile-and-create-:entity',
      enter: async () => {
        await import('@pages/edit-profile');
        nav.set('edit-profile');
        return true;
      },
      render: ({ entity }) =>
        html`<edit-profile .entity=${entity}></edit-profile>`,
    },
    {
      path: '/profile/:address',
      enter: async () => {
        await import('@pages/view-profile');
        nav.set('view-profile');
        return true;
      },
      render: ({ address }) =>
        html` <view-profile .address=${address as string}></view-profile>`,
    },
    {
      path: '/create-solution/:ideaId',
      enter: async () => {
        await import('@pages/create-solution');
        nav.set('create-solution');
        return true;
      },
      render: ({ ideaId }) => {
        return html`<create-solution
          .ideaId=${ideaId as string}
        ></create-solution>`;
      },
    },
  ]);

  @provide({ context: connectionContext }) connection: Connection = {
    connected: false,
  };
  @provide({ context: balanceContext }) balances: Balances = {};
  @provide({ context: updraftSettings }) updraftSettings!: UpdraftSettings;

  constructor() {
    super();

    // Set the theme based on user preference
    this.setupTheme();

    modal.subscribeAccount(async ({ isConnected, address }) => {
      console.log('modal.subscribeAccount called with address:', address);

      if (address) {
        this.connection.address = address as `0x${string}`;
        const result = await urqlClient.query(ProfileDocument, {
          userId: address,
        });
        let profile = {} as Profile;
        if (result.data?.user?.profile) {
          profile = JSON.parse(
            fromHex(result.data.user.profile as `0x${string}`, 'string')
          );
        }
        user.set({
          ...profile,
          name: profile.name || profile.team || address,
          avatar: profile.image || makeBlockie(address),
        });

        // Update new user state with complete profile data
        setUserProfile({
          ...profile,
          name: profile.name || profile.team || address,
          avatar: profile.image || makeBlockie(address),
        });

        // Explicitly close the modal when a connection is successful, but only once
        try {
          // Only try to close if we're not already closing
          if (modal.isOpen()) {
            console.log('Closing modal after successful connection');
            await modal.close();
            console.log('Modal closed after successful connection');
          }
        } catch (error) {
          console.error('Error closing modal:', error);
        }
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
        },
      };
      this.getUpdraftSettings.run().then(() => this.refreshBalances.run());
    });

    this.addEventListener(RequestBalanceRefresh.type, () =>
      this.refreshBalances.run()
    );
  }

  private setupTheme() {
    // Apply the appropriate theme class to the document element
    const prefersDark = window.matchMedia?.(
      '(prefers-color-scheme: dark)'
    ).matches;
    document.documentElement.classList.toggle('sl-theme-dark', prefersDark);
    document.documentElement.classList.toggle('sl-theme-light', !prefersDark);

    // Also apply to the component itself for shadow DOM styling
    this.classList.toggle('sl-theme-dark', prefersDark);
    this.classList.toggle('sl-theme-light', !prefersDark);

    // Listen for changes in color scheme preference
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        const isDark = e.matches;
        document.documentElement.classList.toggle('sl-theme-dark', isDark);
        document.documentElement.classList.toggle('sl-theme-light', !isDark);
        this.classList.toggle('sl-theme-dark', isDark);
        this.classList.toggle('sl-theme-light', !isDark);
      });
  }

  public refreshBalances = new Task(this, {
    task: async () => {
      if (this.connection.address) {
        const gasToken = await getBalance(config, {
          address: this.connection.address,
        });
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
          },
        };
      }
    },
    autoRun: false,
  });

  public getUpdraftSettings = new Task(this, {
    task: async () => {
      const percentScaleBigInt = (await updraft.read('percentScale')) as bigint;
      const minFee = (await updraft.read('minFee')) as bigint;
      const percentFee = (await updraft.read('percentFee')) as bigint;
      const percentScale = Number(percentScaleBigInt);
      const updAddress = (await updraft.read('feeToken')) as `0x${string}`;
      this.updraftSettings = {
        percentScale,
        updAddress,
        percentFee: Number(percentFee) / percentScale,
        minFee: Number(formatUnits(minFee, 18)),
      };
    },
    autoRun: false,
  });

  render() {
    return html` <app-layout> ${this.router.outlet()} </app-layout> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-app': MyApp;
  }
}
