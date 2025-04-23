import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';

import '@shoelace-style/shoelace/dist/components/button/button.js';

import '@components/navigation/search-bar';
import '@components/navigation/create-idea-button';
import '@pages/home/components/tracked-changes';
import '@pages/home/components/beginner-tasks';

import layout from '@state/layout';

@customElement('home-page')
export class HomePage extends SignalWatcher(LitElement) {
  static styles = css`
    .container {
      display: flex;
      flex: 1;
      overflow: hidden;
      background: linear-gradient(
        to bottom,
        var(--subtle-background),
        var(--main-background)
      );
    }

    main {
      flex: 1;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.5rem 1rem;
      color: var(--main-foreground);
      background: var(--main-background);
    }

    .connect-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      text-align: center;
    }
  `;

  render() {
    layout.topBarContent.set(html`
      <create-idea-button></create-idea-button>
      <search-bar></search-bar>
    `);
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(true);
    layout.rightSidebarContent.set(html`
      <hot-ideas></hot-ideas>
      <popular-tags></popular-tags>
      <watched-tags></watched-tags>
    `);

    return html`
      <div class="container">
        <main>
          <tracked-changes></tracked-changes>
          <beginner-tasks></beginner-tasks>
        </main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
