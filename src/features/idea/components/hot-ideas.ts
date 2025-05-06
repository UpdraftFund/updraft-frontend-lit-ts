import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import '@/features/idea/components/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

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
      gap: 1rem;
    }

    .no-ideas {
      color: var(--sl-color-neutral-500);
      font-style: italic;
    }
  `;

  @state() private hotIdeas?: Idea[];

  // Controller for fetching hot ideas
  private readonly hotIdeasController = new UrqlQueryController(
    this,
    IdeasBySharesDocument,
    {},
    (result) => {
      if (result.error) {
        console.error('Error fetching hot ideas:', result.error);
        this.hotIdeas = [];
        return;
      }

      if (result.data?.ideas) {
        this.hotIdeas = result.data.ideas as Idea[];
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
        ${ideas.map(
          (idea) => html` <idea-card-small .idea=${idea}></idea-card-small> `
        )}
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
            : cache(this.renderHotIdeas(this.hotIdeas))}
      </div>
    `;
  }
}
