import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import { UrqlQueryController } from '@utils/urql-query-controller';
import { TopTagsDocument } from '@gql';
import { TagCount } from '@/types';
import { tagBlacklist } from '../config/blacklist';

@customElement('popular-tags')
export class PopularTags extends LitElement {
  static styles = css`
    :host {
      padding: 0 1rem;
    }

    h2 {
      font-size: 1.2rem;
      margin: 0;
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
  @property({ type: Number }) first = 14;

  // Controller for fetching top tags
  private readonly tagsController = new UrqlQueryController(
    this,
    TopTagsDocument,
    { first: this.first },
    (result) => {
      if (result.error) {
        console.error('Error fetching top tags:', result.error);
        return;
      }

      // Filter out blacklisted tags
      const allTags = result.data?.tagCounts as TagCount[];
      this.topTags = this.filterBlacklistedTags(allTags);
    }
  );

  // Method to manually refresh tags if needed
  refreshTags() {
    this.tagsController.refresh();
  }

  // Update the query when properties change
  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);

    if (changedProperties.has('first')) {
      this.tagsController.setVariablesAndSubscribe({ first: this.first });
    }
  }

  private filterBlacklistedTags(tags: TagCount[] | undefined): TagCount[] {
    if (!tags) return [];

    return tags.filter((tag) => {
      // Check if the tag contains any blacklisted string
      return !tagBlacklist.some((blacklistedStr) =>
        tag.id.toLowerCase().includes(blacklistedStr.toLowerCase())
      );
    });
  }

  render() {
    return html`
      ${this.topTags
        ? html`
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
