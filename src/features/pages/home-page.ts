import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';

import '@pages/home/components/tracked-changes';
import '@pages/home/components/beginner-tasks';

import layout from '@state/layout';

@customElement('home-page')
export class HomePage extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      flex: 1;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.5rem 1rem;
      color: var(--main-foreground);
      background: var(--main-background);
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
      <tracked-changes></tracked-changes>
      <beginner-tasks></beginner-tasks>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
