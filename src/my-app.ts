import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { provide } from '@lit/context';
import { Task } from '@lit/task';
import { Router } from '@lit-labs/router';
import { formatUnits } from 'viem';
import { getBalance } from '@wagmi/core';
import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/drawer/drawer.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@styles/global.css';
import '@styles/theme.css';
import '@styles/reset.css';

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
  USER_CONNECTED_EVENT,
  USER_DISCONNECTED_EVENT,
  dispatchUserEvent,
} from '@/state/user-state';

import {
  user,
  connectionContext,
  balanceContext,
  updraftSettings as updraftSettingsContext,
  RequestBalanceRefresh,
} from '@/context';
import { Connection, Balances, UpdraftSettings, Profile } from '@/types';
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

if (!('URLPattern' in globalThis)) {
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

      color: var(--main-foreground);
      background-color: var(--main-background);
      font-family:
        -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica,
        Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
    }

    /* Custom application variables that work with both themes */
    :host,
    :root {
      /* Variables moved to theme.css */
    }

    /* Tab group specific styling - moved to theme.css */

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
      path: '/create-idea-submit',
      enter: async () => {
        // Reset idea state when navigating away from idea page
        resetIdeaState();
        await import('./pages/create-idea');
        return true;
      },
      render: () => html`<create-idea direct-submit></create-idea>`,
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
  @provide({ context: userContext }) userState = getUserState();

  // Provide idea state context
  @provide({ context: ideaContext })
  get ideaState() {
    return getIdeaState();
  }

  @state() expanded = false;

  constructor() {
    super();

    // Set the theme based on user preference
    this.setupTheme();

    modal.subscribeAccount(async ({ address }) => {
      console.log('modal.subscribeAccount called with address:', address);

      if (address) {
        // Update legacy connection context for backward compatibility
        this.connection.address = address as `0x${string}`;

        // Update new user state
        setUserAddress(address as `0x${string}`);

        const result = await urqlClient.query(ProfileDocument, {
          userId: address,
        });
        let profile = {} as Profile;
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
          // Include additional profile data if available
          team: profile.team,
          about: profile.about,
          news: profile.news,
          links: profile.links,
        });

        // Update new user state with complete profile data
        setUserProfile({
          name: profile.name || profile.team || address,
          image: profile.image,
          avatar: profile.image || makeBlockie(address),
          // Include additional profile data if available
          team: profile.team,
          about: profile.about,
          news: profile.news,
          links: profile.links,
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
      } else {
        // If disconnected, reset the user state
        setUserAddress(null);
        setUserProfile(null);
      }

      // Update legacy connection context
      this.connection = {
        ...this.connection,
        connected: !!address,
      };

      // Check if the connection state has changed
      if (!address) {
        dispatchUserEvent(USER_DISCONNECTED_EVENT);
      } else {
        dispatchUserEvent(USER_CONNECTED_EVENT, { address });
      }

      // Update user state property
      this.userState = getUserState();

      // Force a re-render of the app
      this.requestUpdate();
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

      // Update user state property
      this.userState = getUserState();

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

    const ideaLayout: PageLayout = {
      showLeftSidebar: true,
      showRightSidebar: true,
      showHotIdeas: false,
      showSearch: true,
      showDiscoverTabs: true,
      type: 'standard',
      title: 'Idea',
    };
    const discoverLayout: PageLayout = {
      showLeftSidebar: true,
      showRightSidebar: true,
      showHotIdeas: true,
      showSearch: true,
      showDiscoverTabs: true,
      type: 'standard',
      title: 'Discover',
    };
    const homeLayout: PageLayout = {
      showLeftSidebar: true,
      showRightSidebar: true,
      showHotIdeas: true,
      showSearch: true,
      showDiscoverTabs: true,
      type: 'standard',
      title: 'Home',
    };
    const profileLayout: PageLayout = {
      showLeftSidebar: true,
      showRightSidebar: false,
      showHotIdeas: false,
      showSearch: false,
      showDiscoverTabs: false,
      type: 'profile',
      title: 'Profile',
    };
    const editProfileLayout: PageLayout = {
      showLeftSidebar: true,
      showRightSidebar: false,
      showHotIdeas: false,
      showSearch: false,
      showDiscoverTabs: false,
      type: 'profile',
      title: 'Edit Profile',
    };
    const createProfileLayout: PageLayout = {
      showLeftSidebar: true,
      showRightSidebar: true,
      showHotIdeas: true,
      showSearch: false,
      showDiscoverTabs: false,
      type: 'profile',
      title: 'Create Profile',
    };
    const createIdeaLayout: PageLayout = {
      showLeftSidebar: true,
      showRightSidebar: true,
      showHotIdeas: true,
      showSearch: false,
      showDiscoverTabs: false,
      type: 'creation',
      title: 'Create Idea',
    };
    const createSolutionLayout: PageLayout = {
      showLeftSidebar: true,
      showRightSidebar: true,
      showHotIdeas: false,
      showSearch: false,
      showDiscoverTabs: false,
      type: 'creation',
      title: 'Create Solution',
    };

    if (path.startsWith('/idea/')) {
      return ideaLayout;
    } else if (path === '/discover') {
      return discoverLayout;
    } else if (path === '/') {
      return homeLayout;
    } else if (path.startsWith('/profile/')) {
      return profileLayout;
    } else if (path === '/edit-profile') {
      return editProfileLayout;
    } else if (path.startsWith('/submit-profile-and-create-')) {
      return createProfileLayout;
    } else if (path === '/create-idea') {
      return createIdeaLayout;
    } else if (path.startsWith('/create-solution/')) {
      return createSolutionLayout;
    }

    // Default layout
    return {
      showLeftSidebar: true,
      showRightSidebar: false,
      showHotIdeas: false,
      showSearch: true,
      showDiscoverTabs: false,
      type: 'standard',
      title: 'Updraft',
    };
  }

  render() {
    const layout = this.getPageLayout();
    const ideaId = this.getIdeaIdFromUrl();

    return html`
      <top-bar
        ?show-search=${layout.showSearch}
        ?show-discover-tabs=${layout.showDiscoverTabs}
      ></top-bar>
      <div class="app-layout">
        <left-side-bar></left-side-bar>
        <div class="content-wrapper">
          <main class="main-content">${this.router.outlet()}</main>
          ${layout.showRightSidebar
        ? html`
                <right-side-bar
                  .ideaId=${ideaId}
                  ?show-hot-ideas=${layout.showHotIdeas}
                ></right-side-bar>
              `
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
