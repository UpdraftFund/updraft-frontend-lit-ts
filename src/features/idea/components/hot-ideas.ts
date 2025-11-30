import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import '@components/idea/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { sortIdeasByNewest } from '@utils/idea/sort-ideas';
import { UrqlQueryController } from '@utils/urql-query-controller';

import { IdeasBySharesDocument } from '@gql';
import { Idea } from '@/features/idea/types';

@customElement('hot-ideas')
export class HotIdeas extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    h2 {
      margin-top: 0;
      font-size: 1.25rem;
      color: var(--attention);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .hot-ideas-list {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .no-ideas {
      color: var(--no-results);
      font-style: italic;
    }

    .see-more-link {
      display: block;
      margin-top: 1rem;
      text-align: center;
      color: var(--link);
      text-decoration: none;
      font-size: 0.9rem;
    }

    .see-more-link:hover {
      text-decoration: underline;
      color: var(--accent);
    }
  `;

  @state() private hotIdeas?: Idea[];

  // Controller for fetching hot ideas
  private readonly hotIdeasController = new UrqlQueryController(
    this,
    IdeasBySharesDocument,
    { first: 10 },
    (result) => {
      if (result.error) {
        console.error('Error fetching hot ideas:', result.error);
        this.hotIdeas = [];
        return;
      }

      if (result.data?.ideas) {
        // Get ideas ordered by shares, then sub-sort by newest first and take the first 3
        const ideasByShares = result.data.ideas as Idea[];
        this.hotIdeas = sortIdeasByNewest(ideasByShares, 3);
      } else {
        this.hotIdeas = [];
      }
    }
  );

  // Method to manually refresh data if needed
  refreshIdeas() {
    this.hotIdeasController.refresh();
  }

  private renderHotIdeas(ideas: Idea[]) {
    return html`
      <div class="hot-ideas-list">
        ${ideas.map((idea) => html` <idea-card-small .idea=${idea}></idea-card-small> `)}
      </div>
    `;
  }

  render() {
    return html`
      <div>
        <h2>🔥 Hot Ideas</h2>
        ${this.hotIdeas === undefined
          ? html` <sl-spinner></sl-spinner>`
          : this.hotIdeas.length === 0
            ? html` <div class="no-ideas">No ideas found</div>`
            : html`
                ${cache(this.renderHotIdeas(this.hotIdeas))}
                <a href="/discover?tab=hot-ideas" class="see-more-link"> See more hot ideas → </a>
              `}
      </div>
    `;
  }
}
