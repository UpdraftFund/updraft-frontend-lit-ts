import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';

import '@components/idea/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import urqlClient from '@utils/urql-client';
import { IdeasByTagsDocument } from '@gql';
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
  @state() private ideas?: Idea[];
  private unsubIdeas?: () => void;

  private subscribe() {
    // Clean up previous subscription if it exists
    this.unsubIdeas?.();

    if (this.ideaId && this.tags.length > 0) {
      const ideasSub = urqlClient
        .query(IdeasByTagsDocument, {
          tag1: this.tags[0],
          tag2: this.tags[1] || this.tags[0],
          tag3: this.tags[2] || this.tags[0],
          tag4: this.tags[3] || this.tags[0],
          tag5: this.tags[4] || this.tags[0],
        })
        .subscribe((result) => {
          const allIdeas = result.data?.ideas as Idea[];
          this.ideas = allIdeas.filter((idea) => idea.id !== this.ideaId);
        });

      this.unsubIdeas = ideasSub.unsubscribe;
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.unsubIdeas?.();
    } else {
      this.subscribe();
    }
  };

  connectedCallback() {
    super.connectedCallback();
    if (this.ideaId && this.tags.length > 0) {
      this.subscribe();
    }
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubIdeas?.();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
  }

  updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has('ideaId')) {
      this.subscribe();
    }
  }

  render() {
    return html`
      <div>
        <h2>Related Ideas</h2>
        ${this.ideas === undefined
          ? html` <sl-spinner></sl-spinner>`
          : cache(
              this.ideas.length > 0
                ? html`
                    <div class="related-ideas-list">
                      ${this.ideas.map(
                        (idea) => html`
                          <idea-card-small .idea=${idea}></idea-card-small>
                        `
                      )}
                    </div>
                  `
                : html` <div class="no-ideas">No related ideas</div> `
            )}
      </div>
    `;
  }
}
