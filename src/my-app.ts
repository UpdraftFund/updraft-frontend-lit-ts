import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Task } from '@lit/task';
import { Router } from '@lit-labs/router';
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/drawer/drawer.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@styles/global.css';
import '@styles/theme.css';

import { modal, config } from '@/web3';
import urqlClient from '@/urql-client';
import { fromHex } from 'viem';
import makeBlockie from 'ethereum-blockies-base64';

// Import user state context
import {
  userContext,
  getUserState,
  setUserAddress,
  setUserProfile,
  setNetworkName,
} from '@/state/user-state';

import {
  user,
  connectionContext,
  balanceContext,
  updraftSettings as updraftSettingsContext,
  RequestBalanceRefresh,
} from '@/context';
import { Connection, Balances, UpdraftSettings } from '@/types';
import { PageLayout } from '@/types/layout';

import { ProfileDocument } from '@gql';
import { updraft } from '@contracts/updraft.ts';

// Import idea state
import {
  ideaContext,
  getIdeaState,
  resetState as resetIdeaState,
} from '@/state/idea-state';

import '@components/layout/top-bar';
import '@/components/shared/search-bar';
import '@components/layout/left-side-bar';
import '@components/layout/right-side-bar';

// Import our new user-profile component
import '@/components/shared/user-profile';

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
        // Reset idea state when navigating away from idea page
        resetIdeaState();
        await import('./pages/home-page');
        return true;
      },
      render: () => html`<home-page></home-page>`,
    },
    {
      path: '/discover',
      enter: async () => {
        // Reset idea state when navigating away from idea page
        resetIdeaState();
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
        // Reset idea state when navigating to a new idea
        resetIdeaState();
        await import('./pages/idea-page');
        return true;
      },
      render: ({ id }) => html`<idea-page .ideaId=${id}></idea-page>`,
    },
    {
      path: '/create-idea',
      enter: async () => {
        // Reset idea state when navigating away from idea page
        resetIdeaState();
        await import('./pages/create-idea');
        return true;
      },
      render: () => html`<create-idea></create-idea>`,
    },
    {
      path: '/edit-profile',
      enter: async () => {
        // Reset idea state when navigating away from idea page
        resetIdeaState();
        await import('./pages/edit-profile');
        return true;
      },
      render: () => html`<edit-profile></edit-profile>`,
    },
    {
      path: '/submit-profile-and-create-:entity',
      enter: async () => {
        // Reset idea state when navigating away from idea page
        resetIdeaState();
        await import('./pages/edit-profile');
        return true;
      },
      render: ({ entity }) =>
        html`<edit-profile .entity=${entity}></edit-profile>`,
    },
    {
      path: '/profile/:address',
      enter: async () => {
        // Reset idea state when navigating away from idea page
        resetIdeaState();
        await import('./pages/view-profile');
        return true;
      },
      render: ({ address }) =>
        html`<view-profile .address=${address}></view-profile>`,
    },
    {
      path: '/create-solution/:ideaId',
      enter: async () => {
        // Reset idea state when navigating away from idea page
        resetIdeaState();
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
  @provide({ context: updraftSettingsContext })
  updraftSettings!: UpdraftSettings;

  // Provide idea state context
  @provide({ context: ideaContext })
  get ideaState() {
    return getIdeaState();
  }

  // Provide user state context
  @provide({ context: userContext })
  get userState() {
    return getUserState();
  }

  @state() expanded = false;

  constructor() {
    super();

    // Set the theme based on user preference
    this.setupTheme();

    modal.subscribeAccount(async ({ isConnected, address }) => {
      if (address) {
        // Update legacy connection context for backward compatibility
        this.connection.address = address as `0x${string}`;

        // Update new user state
        setUserAddress(address as `0x${string}`);

        const result = await urqlClient.query(ProfileDocument, {
          userId: address,
        });
        let profile = {} as { name: string; team: string; image: string };
        if (result.data?.user?.profile) {
          profile = JSON.parse(
            fromHex(result.data.user.profile as `0x${string}`, 'string')
          );
        }

        // Update legacy user state
        user.set({
          name: profile.name || profile.team || address,
          image: profile.image,
          avatar: profile.image || makeBlockie(address),
        });

        // Update new user state
        setUserProfile({
          name: profile.name || profile.team || address,
          image: profile.image,
          avatar: profile.image || makeBlockie(address),
        });
      }

      // Update legacy connection context
      this.connection = {
        ...this.connection,
        connected: isConnected,
      };
    });

    modal.subscribeNetwork(({ caipNetwork }) => {
      // Update legacy connection context
      this.connection = {
        ...this.connection,
        network: {
          name: caipNetwork!.name,
        },
      };

      // Update new user state
      setNetworkName(caipNetwork?.name || null);

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

  private getCurrentLocation(): string {
    return window.location.pathname;
  }

  private getIdeaIdFromUrl(): string | undefined {
    const match = this.getCurrentLocation().match(/\/idea\/([^/]+)/);
    return match ? match[1] : undefined;
  }

  private getPageLayout(): PageLayout {
    const path = this.getCurrentLocation();

    if (path.startsWith('/idea/')) {
      return {
        showLeftSidebar: true,
        showRightSidebar: true,
        showHotIdeas: false,
        type: 'standard',
        title: 'Idea',
      };
    } else if (path === '/discover') {
      return {
        showLeftSidebar: true,
        showRightSidebar: true,
        showHotIdeas: false,
        type: 'standard',
        title: 'Discover',
      };
    } else if (path === '/') {
      return {
        showLeftSidebar: true,
        showRightSidebar: true,
        showHotIdeas: true,
        type: 'standard',
        title: 'Home',
      };
    } else if (path.startsWith('/profile/')) {
      return {
        showLeftSidebar: true,
        showRightSidebar: false,
        showHotIdeas: false,
        type: 'profile',
        title: 'Profile',
      };
    } else if (path === '/edit-profile') {
      return {
        showLeftSidebar: true,
        showRightSidebar: false,
        showHotIdeas: false,
        type: 'profile',
        title: 'Edit Profile',
      };
    } else if (path.startsWith('/submit-profile-and-create-')) {
      return {
        showLeftSidebar: true,
        showRightSidebar: false,
        showHotIdeas: false,
        type: 'profile',
        title: 'Create Profile',
      };
    } else if (path === '/create-idea') {
      return {
        showLeftSidebar: true,
        showRightSidebar: true,
        showHotIdeas: false,
        type: 'creation',
        title: 'Create Idea',
      };
    } else if (path.startsWith('/create-solution/')) {
      return {
        showLeftSidebar: true,
        showRightSidebar: true,
        showHotIdeas: false,
        type: 'creation',
        title: 'Create Solution',
      };
    }

    // Default layout
    return {
      showLeftSidebar: true,
      showRightSidebar: false,
      showHotIdeas: false,
      type: 'standard',
      title: 'Updraft',
    };
  }

  render() {
    const layout = this.getPageLayout();
    const ideaId = this.getIdeaIdFromUrl();

    return html`
      <top-bar></top-bar>
      <div class="app-layout">
        <left-side-bar></left-side-bar>
        <div class="content-wrapper">
          <main class="main-content">${this.router.outlet()}</main>
          <right-side-bar
            .layout=${layout}
            .ideaId=${ideaId}
            ?show-hot-ideas=${layout.showHotIdeas}
          ></right-side-bar>
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
