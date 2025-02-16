/***
 * This is the right-hand sidebar for the Home and Discover screens.
 * https://www.figma.com/design/lfPeBM41v53XQZLkYRUt5h/Updraft?node-id=920-7089&m=dev
 ***/

import { customElement, state } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { consume } from "@lit/context";

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@components/section-heading';
import '@components/idea-card-small';

import { updraftSettings } from "@/context.ts";
import { UpdraftSettings } from "@/types";

import urqlClient from "@/urql-client.ts";
import { TopTagsDocument, IdeasBySharesDocument } from "@gql";
import { Idea, TagCount } from "@/types";

@customElement('right-side-bar')
export class RightSideBar extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background-color: #f4f4f4; /* Light gray placeholder */
    }

    .hot-ideas {
      padding: 1rem 0;
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

  @consume({ context: updraftSettings, subscribe: true }) updraftSettings! : UpdraftSettings;

  @state() private hotIdeas?: Idea[];
  @state() private topTags?: TagCount[];
  private unsubHotIdeas?: () => void;
  private unsubTopTags?: () => void;

  private subscribe() {
    this.unsubHotIdeas?.();
    this.unsubTopTags?.();

    const hotIdeasSub = urqlClient.query(IdeasBySharesDocument, {}).subscribe(result => {
      this.hotIdeas = result.data?.ideas as Idea[];
    });
    this.unsubHotIdeas = hotIdeasSub.unsubscribe;

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
      <section-heading>Hot Ideas</section-heading>
      <div class="hot-ideas">
        ${this.hotIdeas?.map(idea => html`
        <idea-card-small .idea=${idea}></idea-card-small>
      `)}
      </div>

      <section-heading>Top Tags</section-heading>
      <div class="tags-container">
        ${this.topTags?.map(tag => html`
        <a href="/discover?tag=${tag.id}" class="tag">#${tag.id} (${tag.count})</a>
      `)}
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'right-side-bar': RightSideBar;
  }
}