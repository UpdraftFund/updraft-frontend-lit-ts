import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { Task } from '@lit/task';

import '@/features/idea/components/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import urqlClient from '@/features/common/utils/urql-client';
import { IdeasBySharesDocument } from '@gql';
import { Idea } from '@/features/idea/types';
import { ideaContext, setHotIdeas } from '@/features/idea/state/idea';

import fire from '@icons/fire.svg';

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

  @consume({ context: ideaContext, subscribe: true })
  ideaState: any;

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
        setHotIdeas(ideas);
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
            // If we have hot ideas in the state, show them while loading
            if (this.ideaState?.hotIdeas?.length) {
              return html`
                <sl-spinner></sl-spinner>
                ${this.renderHotIdeas(this.ideaState.hotIdeas as Idea[])}
              `;
            }
            return html`<sl-spinner></sl-spinner>`;
          },
          complete: (ideas) => {
            if (ideas.length === 0) {
              return html`<div class="no-ideas">No hot ideas found</div>`;
            }
            return this.renderHotIdeas(ideas);
          },
          error: (err) => {
            console.error('Error rendering hot ideas:', err);
            // If we have hot ideas in the state, show them despite the error
            if (this.ideaState?.hotIdeas?.length) {
              return html`
                <div class="error">Error loading hot ideas</div>
                ${this.renderHotIdeas(this.ideaState.hotIdeas as Idea[])}
              `;
            }
            return html`<div class="error">Error loading hot ideas</div>`;
          },
        })}
      </div>
    `;
  }
}
