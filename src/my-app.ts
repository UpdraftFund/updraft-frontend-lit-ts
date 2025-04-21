import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Task } from '@lit/task';
import { Router } from '@lit-labs/router';
import { formatUnits } from 'viem';
import { watchAccount } from '@wagmi/core';

import '@layout/app-layout';

import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/drawer/drawer.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@styles/global.css';
import '@styles/theme.css';
import '@styles/reset.css';

import urqlClient from '@utils/urql-client';

import {
  urqlClientContext,
  updraftSettings as updraftSettingsContext,
} from '@state/common';
import { nav } from '@state/navigation';
import { refreshBalances } from '@state/user/balances';

import { UpdraftSettings } from '@/types';
import { initializeUserState, userContext, getUserState } from '@state/user';

import { updraft } from '@contracts/updraft';
import { config } from '@utils/web3';

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
      render: () => html` <home-page></home-page>`,
    },
    {
      path: '/discover',
      enter: async () => {
        await import('@pages/discover-page');
        nav.set('discover');
        return true;
      },
      render: () => {
        return html` <discover-page></discover-page>`;
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
      render: () => html` <create-idea></create-idea>`,
    },
    {
      path: '/edit-profile',
      enter: async () => {
        await import('@pages/edit-profile');
        nav.set('edit-profile');
        return true;
      },
      render: () => html` <edit-profile></edit-profile>`,
    },
    {
      path: '/submit-profile-and-create-:entity',
      enter: async () => {
        await import('@pages/edit-profile');
        nav.set('edit-profile');
        return true;
      },
      render: ({ entity }) =>
        html` <edit-profile .entity=${entity}></edit-profile>`,
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
        return html` <create-solution
          .ideaId=${ideaId as string}
        ></create-solution>`;
      },
    },
    {
      path: '/create-solution-two/:ideaId',
      enter: async () => {
        await import('@pages/create-solution-page-two');
        nav.set('create-solution-two');
        return true;
      },
      render: ({ ideaId }) => {
        return html` <create-solution-page-two
          .ideaId=${ideaId as string}
        ></create-solution-page-two>`;
      },
    },
  ]);

  @provide({ context: urqlClientContext })
  urqlClient = urqlClient;

  @provide({ context: updraftSettingsContext })
  updraftSettings = {
    percentScale: 0,
    updAddress: '0x',
    percentFee: 0,
    minFee: 0,
  } as UpdraftSettings;

  // Explicitly provide user state via context
  @provide({ context: userContext })
  userState = getUserState();

  // Make sure the context stays updated
  updated() {
    // Update the context provider value when anything changes
    this.userState = getUserState();
  }

  constructor() {
    super();
    console.log('MyApp constructor - initializing');
    watchAccount(config, {
      onChange: refreshBalances,
    });
    this.getUpdraftSettings.run();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.setupTheme();
    // Initialize user state including reconnect attempt
    initializeUserState();
  }

  private setupTheme() {
    // TODO: factor out repeated code
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
    return html` <app-layout> ${this.router.outlet()}</app-layout> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-app': MyApp;
  }
}
