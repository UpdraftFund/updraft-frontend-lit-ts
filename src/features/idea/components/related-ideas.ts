import { LitElement, css } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { customElement, property } from 'lit/decorators.js';
import { Task } from '@lit/task';

import '@components/idea/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import urqlClient from '@utils/urql-client';
import { IdeasByTagsDocument } from '@gql';

@customElement('related-ideas')
export class RelatedIdeas extends SignalWatcher(LitElement) {
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
      color: var(--sl-color-neutral-500);
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

  private _getRelatedIdeasTask = new Task(
    this,
    async () => {
      if (!this.ideaId || this.tags.length === 0) {
        return [];
      }
      const result = await urqlClient
        .query(IdeasByTagsDocument, {
          tag1: this.tags[0],
          tag2: this.tags[1] || this.tags[0],
          tag3: this.tags[2] || this.tags[0],
          tag4: this.tags[3] || this.tags[0],
          tag5: this.tags[4] || this.tags[0],
        })
        .toPromise();
      return result.data?.ideas || [];
    },
    () => [this.ideaId, this.tags]
  );

  render() {
    return html`
      <div>
        <h2>Related Ideas</h2>
        ${this._getRelatedIdeasTask.render({
          pending: () => html` <sl-spinner></sl-spinner>`,
          complete: (ideas) => {
            return html`
              ${ideas.length > 0
                ? html`
                    <div class="related-ideas-list">
                      ${ideas.map(
                        (idea) => html`
                          <idea-card-small .idea=${idea}></idea-card-small>
                        `
                      )}
                    </div>
                  `
                : html` <div class="no-ideas">No related ideas</div> `}
            `;
          },
          error: (err: unknown) => {
            console.error('Error rendering related ideas:', err);
            return html` <div class="error">Error loading related ideas</div> `;
          },
        })}
      </div>
    `;
  }
}
