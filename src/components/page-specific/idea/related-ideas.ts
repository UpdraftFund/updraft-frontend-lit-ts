import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { Task } from '@lit/task';
import { consume } from '@lit/context';

import '@/components/shared/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import urqlClient from '@/urql-client';
import { RelatedIdeasDocument } from '@gql';
import { ideaContext } from '@/state/idea-state';
import { IdeaState } from '@/types';

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
      color: var(--sl-color-neutral-500);
      font-style: italic;
    }
  `;

  @property({ type: String })
  ideaId = '';

  // Consume the idea state context instead of using a property for tags
  @consume({ context: ideaContext, subscribe: true })
  ideaState!: IdeaState;

  private _getRelatedIdeasTask = new Task(
    this,
    async () => {
      // Use ideaId from property and tags from context
      const tags = this.ideaState.tags;
      
      if (!this.ideaId || !tags || tags.length === 0) {
        return { ideas: [] };
      }

      try {
        // Query for each tag and combine results
        const allResults = await Promise.all(
          tags.map(tag =>
            urqlClient.query(RelatedIdeasDocument, {
              ideaId: this.ideaId,
              tag,
            })
          )
        );

        // Combine and deduplicate results
        const allIdeas = allResults.flatMap(result => result.data?.ideas || []);
        
        // Deduplicate by idea ID
        const uniqueIdeas = Array.from(
          new Map(allIdeas.map(idea => [idea.id, idea])).values()
        );
        
        // Sort by shares (descending)
        uniqueIdeas.sort((a, b) => Number(b.shares) - Number(a.shares));
        
        // Take only the top 3
        const topIdeas = uniqueIdeas.slice(0, 3);
        
        return { ideas: topIdeas };
      } catch (err) {
        console.error('Error fetching related ideas:', err);
        return { ideas: [] };
      }
    },
    () => [this.ideaId, this.ideaState.tags]
  );

  render() {
    return html`
      <div>
        <h2>Related Ideas</h2>
        ${this._getRelatedIdeasTask.render({
          pending: () => html`<sl-spinner></sl-spinner>`,
          complete: (data) => {
            const ideas = data?.ideas || [];
            
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
                : html`<div class="no-ideas">No related ideas found</div>`
              }
            `;
          },
          error: (err: unknown) => {
            console.error('Error rendering related ideas:', err);
            return html`<div class="error">Error loading related ideas</div>`;
          },
        })}
      </div>
    `;
  }
}
