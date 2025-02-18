/***
 * This is the right-hand sidebar for the Home and Discover screens.
 * https://www.figma.com/design/lfPeBM41v53XQZLkYRUt5h/Updraft?node-id=920-7089&m=dev
 ***/

import { customElement, state, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { consume } from "@lit/context";

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@components/idea-card-small';

import fire from '@icons/fire.svg';

import { updraftSettings } from "@/context.ts";
import { UpdraftSettings } from "@/types";

import urqlClient from "@/urql-client.ts";
import { TopTagsDocument, IdeasBySharesDocument } from "@gql";
import { Idea, TagCount } from "@/types";

@customElement('right-side-bar')
export class RightSideBar extends LitElement {
  static styles = css`
    :host {
      width: 100%;
      height: 100%;
      color: var(--main-foreground);
      background-color: var(--subtle-background);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .section {
      background-color: var(--main-background);
      padding: 1rem;
      border-radius: 20px;
    }

    h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 1rem 0;
    }

    .tag {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background-color: var(--subtle-background);
      border-radius: 1rem;
      font-size: 0.875rem;
      text-decoration: none;
      color: var(--main-foreground);
    }

    .tag:hover {
      background-color: var(--accent);
      color: white;
    }

    idea-card-small {
      width: 100%;
    }
  `

  @property({ type: Boolean, reflect: true, attribute: 'show-hot-ideas' }) showHotIdeas = false;

  @consume({ context: updraftSettings, subscribe: true }) updraftSettings! : UpdraftSettings;

  @state() private hotIdeas?: Idea[];
  @state() private topTags?: TagCount[];

  private unsubHotIdeas?: () => void;
  private unsubTopTags?: () => void;

  private subscribe() {
    this.unsubHotIdeas?.();
    this.unsubTopTags?.();

    if(this.showHotIdeas) {
      const hotIdeasSub = urqlClient.query(IdeasBySharesDocument, {}).subscribe(result => {
        this.hotIdeas = result.data?.ideas as Idea[];
      });
      this.unsubHotIdeas = hotIdeasSub.unsubscribe;
    }

    const topTagsSub = urqlClient.query(TopTagsDocument, {}).subscribe(result => {
      this.topTags = result.data?.tagCounts as TagCount[];
    });
    this.unsubTopTags = topTagsSub.unsubscribe;
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      // Page is hidden, unsubscribe to save resources
      this.unsubHotIdeas?.();
      this.unsubTopTags?.();
    } else {
      // Page is visible again, reestablish subscription
      this.subscribe();
    }
  };

  connectedCallback() {
    super.connectedCallback();
    this.subscribe();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubHotIdeas?.();
    this.unsubTopTags?.();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  render() {
    return html`
      ${this.showHotIdeas ? html`
      <div class="section">
        <h2>Hot Ideas <sl-icon src=${fire}></sl-icon></h2>
        ${this.hotIdeas?.map(idea => html`
          <idea-card-small .idea=${idea}></idea-card-small>
        `)}
      </div>
      ` : ''}
      <div class="section">
        <h2>Top Tags</h2>
        <div class="tags-container">
          ${this.topTags?.map(tag => html`
            <a href="/discover?search=[${tag.id}]" class="tag">${tag.id}</a>
          `)}
        </div>
      </div>
      <div class="section">
        <h2>Watched Tags</h2>
        <div class="tags-container"></div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'right-side-bar': RightSideBar;
  }
}