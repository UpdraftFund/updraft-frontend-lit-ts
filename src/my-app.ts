import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Router } from '@lit-labs/router';
import { Task } from '@lit/task';
import { getBalance } from '@wagmi/core';
import { formatUnits, fromHex } from 'viem';
import makeBlockie from 'ethereum-blockies-base64';

// Import both themes but only one will be activated based on user preference
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import '@styles/reset.css';
import '@styles/global.css';
import '@styles/theme.css';

import { modal, config } from '@/web3';

import {
  user,
  connectionContext,
  balanceContext,
  RequestBalanceRefresh,
  updraftSettings,
} from '@/context';
import { Connection, Balances, UpdraftSettings } from '@/types';
import { PageLayout } from '@/types/layout';

import urqlClient from '@/urql-client';
import { ProfileDocument } from '@gql';
import { updraft } from '@contracts/updraft.ts';

import '@components/layout/top-bar';
import '@components/search-bar';
import '@components/layout/left-side-bar';
import '@components/layout/right-side-bar';

// @ts-ignore: Property 'UrlPattern' does not exist
if (!globalThis.URLPattern) {
  await import('urlpattern-polyfill');
}

@customElement('my-app')
export class MyApp extends LitElement {
  static styles = css`
    :host {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      max-width: 100vw;

      color: var(--sl-color-neutral-900);
      background-color: var(--sl-color-neutral-0);
      font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica,
        Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
    }

    /* Custom application variables that work with both themes */
    :host,
    :root {
      --main-background: var(--sl-color-neutral-0);
      --subtle-background: var(--sl-color-neutral-50);
      --main-foreground: var(--sl-color-neutral-900);
      --section-heading: var(--sl-color-neutral-600);
      --accent: var(--sl-color-primary-600);
      --accent-subtle: var(--sl-color-primary-100);
      --accent-muted: var(--sl-color-primary-400);
      --accent-emphasis: var(--sl-color-primary-700);
      --danger: var(--sl-color-danger-600);
      --danger-subtle: var(--sl-color-danger-100);
      --success: var(--sl-color-success-600);
      --success-subtle: var(--sl-color-success-100);
      --attention: var(--sl-color-warning-600);
      --attention-subtle: var(--sl-color-warning-100);
      --border-default: var(--sl-color-neutral-200);
      --border-muted: var(--sl-color-neutral-100);
      --neutral-muted: var(--sl-color-neutral-400);
      --neutral-subtle: var(--sl-color-neutral-50);
    }

    /* Tab group specific styling */
    ::slotted(sl-tab-group)::part(base) {
      --indicator-color: var(--accent);
      --track-color: var(--border-default);
    }

    ::slotted(sl-tab)::part(base) {
      color: var(--main-foreground);
    }

    ::slotted(sl-tab[active])::part(base) {
      color: var(--accent);
      font-weight: 600;
    }

    .app-layout {
      display: flex;
      flex: 1;
      height: calc(100vh - 64px); /* Subtract top-bar height */
      overflow: hidden;
    }

    left-side-bar {
      flex: 0 0 250px;
      overflow-y: auto;
      height: 100%;
      transition: flex-basis 0.3s ease;
    }

    .content-wrapper {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 0 0.3rem;
      background: var(--subtle-background);
      min-width: 0; /* Allow content to shrink below its minimum content size */
    }

    right-side-bar {
      flex: 0 0 300px;
      overflow-y: auto;
      height: 100%;
    }

    /* Responsive layout */
    @media (max-width: 1024px) {
      .main-content {
        padding: 0 0.3rem;
      }

      /* Ensure right sidebar is visible in tablet view by default */
      right-side-bar {
        flex: 0 0 300px;
        display: block;
      }
    }

    @media (max-width: 768px) {
      .app-layout {
        flex-direction: column;
        height: auto;
        min-height: calc(100vh - 64px);
      }

      .content-wrapper {
        flex-direction: column;
      }

      .main-content {
        padding: 1rem;
        order: 1; /* Main content first */
      }

      right-side-bar {
        display: block; /* Ensure it's displayed on mobile */
        width: 100%;
        flex: none;
        order: 2; /* Right sidebar below main content */
      }
    }

    @media (max-width: 480px) {
      .main-content {
        padding: 0.5rem;
      }
    }

    /* Drawer backdrop styling */
    .drawer-backdrop {
      display: none;
    }

    /* Icon button styling */
    .icon-button {
      color: var(--main-foreground);
    }

    search-bar {
      margin: 0 auto;
    }
  `;

  private router = new Router(this, [
    {
      path: '/',
      enter: async () => {
        await import('./pages/home-page');
        return true;
      },
      render: () => html`<home-page></home-page>`,
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
        return html`<discover-page
          .search=${search}
          .tab=${tab}
        ></discover-page>`;
      },
    },
    {
      path: '/idea/:id',
      enter: async () => {
        await import('./pages/idea-page');
        return true;
      },
      render: ({ id }) => html`<idea-page .ideaId=${id}></idea-page>`,
    },
    {
      path: '/create-idea',
      enter: async () => {
        await import('./pages/create-idea');
        return true;
      },
      render: () => html`<create-idea></create-idea>`,
    },
    {
      path: '/edit-profile',
      enter: async () => {
        await import('./pages/edit-profile');
        return true;
      },
      render: () => html`<edit-profile></edit-profile>`,
    },
    {
      path: '/submit-profile-and-create-:entity',
      enter: async () => {
        await import('./pages/edit-profile');
        return true;
      },
      render: ({ entity }) =>
        html`<edit-profile .entity=${entity}></edit-profile>`,
    },
    {
      path: '/profile/:address',
      enter: async () => {
        await import('./pages/view-profile');
        return true;
      },
      render: ({ address }) =>
        html`<view-profile .address=${address}></view-profile>`,
    },
    {
      path: '/create-solution/:ideaId',
      enter: async () => {
        await import('./pages/create-solution');
        return true;
      },
      render: ({ ideaId }) => {
        if (!ideaId) {
          return html`<div>No idea id</div>`;
        }
        return html`<create-solution .ideaId=${ideaId}></create-solution>`;
      },
    },
  ]);

  @provide({ context: connectionContext }) connection: Connection = {
    connected: false,
  };
  @provide({ context: balanceContext }) balances: Balances = {};
  @provide({ context: updraftSettings }) updraftSettings!: UpdraftSettings;

  private search: string = '';

  @state() expanded = false;

  constructor() {
    super();

    // Set the theme based on user preference
    this.setupTheme();

    modal.subscribeAccount(async ({ isConnected, address }) => {
      if (address) {
        this.connection.address = address as `0x${string}`;
        const result = await urqlClient.query(ProfileDocument, {
          userId: address,
        });
        let profile = {} as { name: string; team: string; image: string };
        if (result.data?.user?.profile) {
          profile = JSON.parse(
            fromHex(result.data.user.profile as `0x${string}`, 'string')
          );
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
        document.documentElement.classList.toggle('sl-theme-dark', e.matches);
        document.documentElement.classList.toggle('sl-theme-light', !e.matches);
        this.classList.toggle('sl-theme-dark', e.matches);
        this.classList.toggle('sl-theme-light', !e.matches);
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

  getCurrentLocation(): string {
    const path = window.location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/discover')) return 'discover';
    if (path.startsWith('/idea/')) return 'idea';
    if (path.startsWith('/solution/')) return 'solution';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/create')) return 'create';
    return 'not-found';
  }

  getPageLayout(): PageLayout {
    // Define different layouts based on the current route
    const currentLocation = this.getCurrentLocation();

    if (currentLocation === 'home') {
      return {
        showLeftSidebar: true,
        showRightSidebar: true,
        showHotIdeas: true,
      };
    } else if (currentLocation === 'discover') {
      return {
        showLeftSidebar: true,
        showRightSidebar: true,
        showHotIdeas: false,
      };
    } else if (currentLocation === 'idea' || currentLocation === 'solution') {
      return {
        showLeftSidebar: true,
        showRightSidebar: true,
        showHotIdeas: false,
      };
    } else if (currentLocation === 'profile') {
      return {
        showLeftSidebar: true,
        showRightSidebar: false,
        showHotIdeas: false,
      };
    } else if (currentLocation === 'create') {
      return {
        showLeftSidebar: true,
        showRightSidebar: true,
        showHotIdeas: false,
      };
    } else {
      return {
        showLeftSidebar: true,
        showRightSidebar: false,
        showHotIdeas: false,
      };
    }
  }

  render() {
    const layout = this.getPageLayout();
    const location = this.getCurrentLocation();

    const params = new URLSearchParams(window.location.search);
    this.search = params.get('search') || '';

    return html`
      <top-bar><search-bar value=${this.search}></search-bar></top-bar>
      <div class="app-layout">
        ${layout.showLeftSidebar
          ? html`<left-side-bar
              .location=${location}
              @expanded=${(e: CustomEvent) => (this.expanded = e.detail)}
            ></left-side-bar>`
          : ''}
        <div class="content-wrapper">
          <div class="main-content">${this.router.outlet()}</div>
          ${layout.showRightSidebar
            ? html`<right-side-bar
                ?show-hot-ideas=${layout.showHotIdeas}
                ?expanded=${this.expanded}
              ></right-side-bar>`
            : ''}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-app': MyApp;
  }
}
