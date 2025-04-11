import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Task } from '@lit/task'; // Restore Task import
import { Router } from '@lit-labs/router';
import { formatUnits } from 'viem';
// import makeBlockie from 'ethereum-blockies-base64'; // No longer used here

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

import urqlClient from '@/features/common/utils/urql-client';

import {
  urqlClientContext,
  updraftSettings, // Corrected import name
} from '@/features/common/state/context'; // Keep these
import { UpdraftSettings } from '@/features/common/types';
import { initializeUserState } from '@/features/user/state/user';

import { nav } from '@state/navigation/navigation';

import { updraft } from '@contracts/updraft';

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

  @provide({ context: urqlClientContext })
  urqlClient = urqlClient;

  @provide({ context: updraftSettings }) // Use the correct context
  updraftSettings = {
    percentScale: 0,
    updAddress: '0x',
    percentFee: 0,
    minFee: 0,
  } as UpdraftSettings;

  constructor() {
    super();

    this.setupTheme();
    this.getUpdraftSettings.run();
  }

  connectedCallback(): void {
    super.connectedCallback(); // Call super
    initializeUserState(); // Initialize user state including reconnect attempt
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
