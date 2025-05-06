/***
 * This component displays the popular tags section in the right sidebar.
 * It fetches and displays the most popular tags from the API.
 ***/

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import { UrqlQueryController } from '@utils/urql-query-controller';
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

  // Controller for fetching top tags
  private readonly tagsController = new UrqlQueryController(
    this,
    TopTagsDocument,
    {},
    (result) => {
      if (result.error) {
        console.error('Error fetching top tags:', result.error);
        return;
      }

      this.topTags = result.data?.tagCounts as TagCount[];
    }
  );

  // Method to manually refresh tags if needed
  refreshTags() {
    this.tagsController.refresh();
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
