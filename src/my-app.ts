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
