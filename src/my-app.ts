import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Router } from '@lit-labs/router';
import { Task } from '@lit/task';
import { getBalance } from '@wagmi/core';
import { formatUnits, fromHex } from 'viem';
import makeBlockie from 'ethereum-blockies-base64';

import '@shoelace-style/shoelace/dist/themes/light.css';
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
      --main-background: #ffffff;
      --subtle-background: #f6f8fa;
      --main-foreground: #24292f;
      --section-heading: #57606a;
      --accent: #0969da;
      --accent-subtle: #ddf4ff;
      --accent-muted: #54aeff;
      --accent-emphasis: #0969da;
      --danger: #cf222e;
      --danger-subtle: #ffebe9;
      --success: #1a7f37;
      --success-subtle: #dafbe1;
      --attention: #9a6700;
      --attention-subtle: #fff8c5;
      --border-default: #d0d7de;
      --border-muted: #d8dee4;
      --neutral-muted: #afb8c1;
      --neutral-subtle: #f6f8fa;
      color: var(--main-foreground);
      background-color: var(--main-background);
      font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif,
        'Apple Color Emoji', 'Segoe UI Emoji';
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
    @media (max-width: 1200px) {
      .main-content {
        padding: 1.5rem;
      }

      right-side-bar {
        display: none;
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

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      :host {
        --main-background: #0d1117;
        --subtle-background: #161b22;
        --main-foreground: #c9d1d9;
        --section-heading: #8b949e;
        --accent: #58a6ff;
        --accent-subtle: #388bfd26;
        --accent-muted: #388bfd;
        --accent-emphasis: #1f6feb;
        --danger: #f85149;
        --danger-subtle: #f8514926;
        --success: #3fb950;
        --success-subtle: #3fb95026;
        --attention: #d29922;
        --attention-subtle: #d2992226;
        --border-default: #30363d;
        --border-muted: #21262d;
        --neutral-muted: #6e7681;
        --neutral-subtle: #161b22;
      }
    }
  `;

  private router = new Router(this, [
    {
      path: '/',
      enter: async () => {
        await import('./pages/home-page');
        return true;
      },
      render: () => html` <home-page></home-page>`,
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
        return html` <discover-page .search=${search} .tab=${tab}></discover-page>`;
      },
    },
    {
      path: '/idea/:id',
      enter: async () => {
        await import('./pages/idea-page');
        return true;
      },
      render: ({ id }) => html` <idea-page .ideaId=${id}></idea-page>`,
    },
    {
      path: '/create-idea',
      enter: async () => {
        await import('./pages/create-idea');
        return true;
      },
      render: () => html` <create-idea></create-idea>`,
    },
    {
      path: '/edit-profile',
      enter: async () => {
        await import('./pages/edit-profile');
        return true;
      },
      render: () => html` <edit-profile></edit-profile>`,
    },
    {
      path: '/submit-profile-and-create-:entity',
      enter: async () => {
        await import('./pages/edit-profile');
        return true;
      },
      render: ({ entity }) => html` <edit-profile .entity=${entity}></edit-profile>`,
    },
    {
      path: '/profile/:address',
      enter: async () => {
        await import('./pages/view-profile');
        return true;
      },
      render: ({ address }) => html` <view-profile .address=${address}></view-profile>`,
    },
    {
      path: '/create-solution/:ideaId',
      enter: async () => {
        await import('./pages/create-solution');
        return true;
      },
      render: ({ ideaId }) => {
        if (!ideaId) {
          return html` <div>No idea id</div>`;
        }
        return html` <create-solution .ideaId=${ideaId}></create-solution>`;
      },
    },
  ]);

  @provide({ context: connectionContext }) connection: Connection = {
    connected: false,
  };
  @provide({ context: balanceContext }) balances: Balances = {};
  @provide({ context: updraftSettings }) updraftSettings!: UpdraftSettings;

  private search: string = '';

  constructor() {
    super();

    modal.subscribeAccount(async ({ isConnected, address }) => {
      if (address) {
        this.connection.address = address as `0x${string}`;
        const result = await urqlClient.query(ProfileDocument, {
          userId: address,
        });
        let profile = {} as { name: string; team: string; image: string };
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
        },
      };
      this.getUpdraftSettings.run().then(() => this.refreshBalances.run());
    });

    this.addEventListener(RequestBalanceRefresh.type, () => this.refreshBalances.run());
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

  getPageLayout(): PageLayout {
    // Define different layouts based on the current route
    const path = window.location.pathname;

    if (path === '/') {
      return {
        showLeftSidebar: true,
        showRightSidebar: true,
        showHotIdeas: true,
      };
    } else if (path.startsWith('/discover')) {
      return {
        showLeftSidebar: true,
        showRightSidebar: true,
        showHotIdeas: false,
      };
    } else if (path.startsWith('/idea/') || path.startsWith('/solution/')) {
      return {
        showLeftSidebar: true,
        showRightSidebar: false,
        showHotIdeas: false,
      };
    } else if (path.startsWith('/profile')) {
      return {
        showLeftSidebar: true,
        showRightSidebar: false,
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

  getCurrentLocation(): string {
    const path = window.location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/discover')) return 'discover';
    if (path.startsWith('/idea/')) return 'idea';
    if (path.startsWith('/solution/')) return 'solution';
    if (path.startsWith('/profile')) return 'profile';
    return 'not-found';
  }

  render() {
    const layout = this.getPageLayout();
    const location = this.getCurrentLocation();

    const params = new URLSearchParams(window.location.search);
    this.search = params.get('search') || '';

    return html`
      <top-bar><search-bar value=${this.search}></search-bar></top-bar>
      <div class="app-layout">
        ${layout.showLeftSidebar ? html`<left-side-bar .location=${location}></left-side-bar>` : ''}
        <div class="content-wrapper">
          <div class="main-content">${this.router.outlet()}</div>
          ${layout.showRightSidebar
            ? html`<right-side-bar ?show-hot-ideas=${layout.showHotIdeas}></right-side-bar>`
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
