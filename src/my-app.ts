import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';

import '@layout/app-layout';

import '@shoelace-style/shoelace/dist/themes/light.css';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import '@styles/global.css';
import '@styles/theme.css';
import '@styles/reset.css';

import { nav } from '@state/navigation';
import { initializeUserState } from '@state/user';

if (!('URLPattern' in globalThis)) {
  await import('urlpattern-polyfill');
}

@customElement('my-app')
export class MyApp extends LitElement {
  private scrollToTop() {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  }

  private router = new Router(this, [
    {
      path: '/',
      enter: async () => {
        await import('@pages/home-page');
        nav.set('home');
        this.scrollToTop();
        return true;
      },
      render: () => html` <home-page></home-page>`,
    },
    {
      path: '/discover',
      enter: async () => {
        await import('@pages/discover-page');
        nav.set('discover');
        this.scrollToTop();
        return true;
      },
      render: () => html` <discover-page></discover-page>`,
    },
    {
      path: '/idea/:id',
      enter: async () => {
        await import('@pages/idea-page');
        nav.set('idea');
        this.scrollToTop();
        return true;
      },
      render: ({ id }) => html` <idea-page .ideaId=${id}></idea-page>`,
    },
    {
      path: '/create-idea',
      enter: async () => {
        await import('@pages/create-idea');
        nav.set('create-idea');
        this.scrollToTop();
        return true;
      },
      render: () => html` <create-idea></create-idea>`,
    },
    {
      path: '/edit-profile',
      enter: async () => {
        await import('@pages/edit-profile');
        nav.set('edit-profile');
        this.scrollToTop();
        return true;
      },
      render: () => html` <edit-profile></edit-profile>`,
    },
    {
      path: '/submit-profile-and-create-:entity',
      enter: async () => {
        await import('@pages/edit-profile');
        nav.set('edit-profile');
        this.scrollToTop();
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
        this.scrollToTop();
        return true;
      },
      render: ({ address }) =>
        html` <view-profile .address=${address}></view-profile>`,
    },
    {
      path: '/create-solution/:ideaId',
      enter: async () => {
        await import('@pages/create-solution');
        nav.set('create-solution');
        this.scrollToTop();
        return true;
      },
      render: ({ ideaId }) =>
        html` <create-solution .ideaId=${ideaId}></create-solution>`,
    },
    {
      path: '/create-solution-two/:ideaId',
      enter: async () => {
        await import('@pages/create-solution-page-two');
        nav.set('create-solution-two');
        this.scrollToTop();
        return true;
      },
      render: ({ ideaId }) =>
        html` <create-solution-page-two
          .ideaId=${ideaId}
        ></create-solution-page-two>`,
    },
    {
      path: '/solution/:solutionId',
      enter: async () => {
        await import('@pages/solution-page');
        nav.set('solution');
        this.scrollToTop();
        return true;
      },
      render: ({ solutionId }) =>
        html` <solution-page .solutionId=${solutionId}></solution-page>`,
    },
    {
      path: '/edit-solution/:solutionId',
      enter: async () => {
        await import('@pages/edit-solution');
        nav.set('edit-solution');
        this.scrollToTop();
        return true;
      },
      render: ({ solutionId }) =>
        html` <edit-solution .solutionId=${solutionId}></edit-solution>`,
    },
    {
      path: '/split-transfer/:id/:position',
      enter: async () => {
        await import('@pages/split-transfer');
        nav.set('split-transfer');
        this.scrollToTop();
        return true;
      },
      render: ({ id, position }) =>
        html` <split-transfer
          .entityId=${id}
          .position=${position || '0'}
        ></split-transfer>`,
    },
  ]);

  connectedCallback(): void {
    super.connectedCallback();
    this.setupTheme();
    // Initialize user state including reconnect attempt
    initializeUserState();
  }

  private setupTheme() {
    // Initial theme setup based on user preference
    const prefersDark = window.matchMedia?.(
      '(prefers-color-scheme: dark)'
    ).matches;
    this.applyTheme(prefersDark);

    // Listen for changes in color scheme preference
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        this.applyTheme(e.matches);
      });
  }

  private applyTheme(isDark: boolean) {
    // Apply the appropriate theme class to the document (root) element
    document.documentElement.classList.toggle('sl-theme-dark', isDark);
    document.documentElement.classList.toggle('sl-theme-light', !isDark);
  }

  render() {
    return html` <app-layout> ${this.router.outlet()}</app-layout> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-app': MyApp;
  }
}
