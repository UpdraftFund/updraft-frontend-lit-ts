/***
 * This component displays the popular tags section in the right sidebar.
 * It fetches and displays the most popular tags from the API.
 ***/

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import urqlClient from '@utils/urql-client';
import { TopTagsDocument } from '@gql';
import { TagCount } from '@/types';

@customElement('popular-tags')
export class PopularTags extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    h2 {
      font-size: 1.2rem;
      margin: 0 0 1rem 0;
      color: var(--section-heading);
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
      color: var(--sl-color-neutral-0);
    }
  `;

  @state() private topTags?: TagCount[];
  private unsubTopTags?: () => void;

  private subscribe() {
    this.unsubTopTags?.();

    const topTagsSub = urqlClient
      .query(TopTagsDocument, {})
      .subscribe((result) => {
        this.topTags = result.data?.tagCounts as TagCount[];
      });
    this.unsubTopTags = topTagsSub.unsubscribe;
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.unsubTopTags?.();
    } else {
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
    this.unsubTopTags?.();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
  }

  render() {
    return html`
      ${this.topTags
        ? html`
            <div class="section">
              <h2>Popular Tags</h2>
              <div class="tags-container">
                ${cache(
                  this.topTags.map(
                    (tag) => html`
                      <a class="tag" href="/discover?search=[${tag.id}]">
                        ${tag.id}
                      </a>
                    `
                  )
                )}
              </div>
            </div>
          `
        : html``}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'popular-tags': PopularTags;
  }
}
