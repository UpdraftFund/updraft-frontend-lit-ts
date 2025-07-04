import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

import '@components/navigation/search-bar';
import '@components/navigation/create-idea-button';
import '@components/idea/hot-ideas';
import '@components/tags/popular-tags';
import '@components/tags/watched-tags';
import '@components/home/tracked-changes';
import '@components/home/tasks-list.ts';

import layout from '@state/layout';

@customElement('home-page')
export class HomePage extends LitElement {
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

  connectedCallback() {
    super.connectedCallback();
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
  }

  render() {
    return html`
      <tracked-changes></tracked-changes>
      <tasks-list></tasks-list>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
