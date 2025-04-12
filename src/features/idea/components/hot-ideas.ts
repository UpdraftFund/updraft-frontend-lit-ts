import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { Task } from '@lit/task';
import { cache } from 'lit/directives/cache.js';

import '@/features/idea/components/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import urqlClient from '@/features/common/utils/urql-client';
import { IdeasBySharesDocument } from '@gql';
import { Idea } from '@/features/idea/types';

import fire from '@icons/idea/fire.svg';

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

  private unsubHotIdeas?: () => void;

  connectedCallback() {
    super.connectedCallback();
    this._getHotIdeasTask.run();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
    this.unsubHotIdeas?.();
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      this._getHotIdeasTask.run();
    }
  };

  private _getHotIdeasTask = new Task(
    this,
    async () => {
      const result = await urqlClient
        .query(IdeasBySharesDocument, {})
        .toPromise();
      if (result.data?.ideas) {
        const ideas = result.data.ideas as Idea[];
        return ideas;
      }
      return [] as Idea[];
    },
    () => []
  );

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
        <h2>
          <sl-icon src=${fire}></sl-icon>
          Hot Ideas
        </h2>
        ${this._getHotIdeasTask.render({
          pending: () => {
            return html`<sl-spinner></sl-spinner>`;
          },
          complete: (ideas) => {
            // use cache for faster rendering of the fetched results
            return cache(
              ideas.length === 0
                ? html` <div class="no-ideas">No hot ideas found</div>`
                : this.renderHotIdeas(ideas)
            );
          },
          error: (err) => {
            console.error('Error rendering hot ideas:', err);
          },
        })}
      </div>
    `;
  }
}
