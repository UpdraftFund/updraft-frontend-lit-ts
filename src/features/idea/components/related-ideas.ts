import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import '@components/idea/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { UrqlQueryController } from '@utils/urql-query-controller';
import { IdeasByTagsOrDocument } from '@gql';
import { Idea } from '@/types';

@customElement('related-ideas')
export class RelatedIdeas extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 1rem;
    }

    h2 {
      margin-top: 0;
      font-size: 1.25rem;
    }

    .related-ideas-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .no-ideas {
      color: var(--no-results);
      font-style: italic;
    }

    .debug-info {
      font-size: 0.8rem;
      color: var(--sl-color-neutral-400);
      margin-top: 0.5rem;
      font-style: italic;
    }
  `;

  @property({ type: String }) ideaId = '';
  @property({ type: Array }) tags = [];
  @state() private ideas?: Idea[];

  // Controller for fetching related ideas
  private readonly ideasController = new UrqlQueryController(
    this,
    IdeasByTagsOrDocument,
    {
      tag1: this.tags?.[0] || '',
      tag2: this.tags?.[1] || this.tags?.[0] || '',
      tag3: this.tags?.[2] || this.tags?.[0] || '',
      tag4: this.tags?.[3] || this.tags?.[0] || '',
      tag5: this.tags?.[4] || this.tags?.[0] || '',
    },
    (result) => {
      if (result.error) {
        console.error('Error fetching related ideas:', result.error);
        this.ideas = [];
        return;
      }

      const allIdeas = result.data?.ideas as Idea[];
      this.ideas = allIdeas?.filter((idea) => idea.id !== this.ideaId) || [];
    }
  );

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('ideaId') || changedProperties.has('tags')) {
      if (this.ideaId && this.tags?.length > 0) {
        this.ideasController.setVariablesAndSubscribe({
          tag1: this.tags[0],
          tag2: this.tags[1] || this.tags[0],
          tag3: this.tags[2] || this.tags[0],
          tag4: this.tags[3] || this.tags[0],
          tag5: this.tags[4] || this.tags[0],
        });
      } else {
        this.ideas = [];
      }
    }
  }

  render() {
    return html`
      <div>
        <h2>Related Ideas</h2>
        ${this.ideas === undefined
          ? html` <sl-spinner></sl-spinner>`
          : this.ideas.length > 0
            ? cache(html`
                <div class="related-ideas-list">
                  ${this.ideas.map(
                    (idea) => html`
                      <idea-card-small .idea=${idea}></idea-card-small>
                    `
                  )}
                </div>
              `)
            : html` <div class="no-ideas">No related ideas</div> `}
      </div>
    `;
  }
}
