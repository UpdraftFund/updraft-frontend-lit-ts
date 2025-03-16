import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { consume } from '@lit/context';
import { Task } from '@lit/task';

import '@/components/shared/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import urqlClient from '@/urql-client';
import { IdeasBySharesDocument } from '@gql';
import { Idea } from '@/types';
import { ideaContext, setHotIdeas } from '@/state/idea-state';

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
    // Start the task to fetch hot ideas
    this._getHotIdeasTask.run();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubHotIdeas?.();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.unsubHotIdeas?.();
    } else {
      this._getHotIdeasTask.run();
    }
  };

  private _getHotIdeasTask = new Task(
    this,
    async () => {
      const result = await urqlClient.query(IdeasBySharesDocument, {});
      const ideas = result.data?.ideas as Idea[];
      setHotIdeas(ideas);
      return ideas;
    },
    () => []
  );

  render() {
    return html`
      <div>
        <h2>
          <sl-icon src=${fire}></sl-icon>
          Hot Ideas
        </h2>
        ${this._getHotIdeasTask.render({
          pending: () => {
            // If we already have hot ideas in the state, show them while loading
            if (this.ideaState?.hotIdeas?.length) {
              return this.renderHotIdeas(this.ideaState.hotIdeas);
            }
            return html`<sl-spinner></sl-spinner>`;
          },
          complete: (ideas) => {
            // If the task completed but we have no ideas, check the state
            if (!ideas || ideas.length === 0) {
              if (this.ideaState?.hotIdeas?.length) {
                return this.renderHotIdeas(this.ideaState.hotIdeas);
              }
              return html`<div class="no-ideas">No hot ideas found</div>`;
            }
            return this.renderHotIdeas(ideas);
          },
          error: (err: unknown) => {
            console.error('Error rendering hot ideas:', err);
            // If we have hot ideas in the state, show them despite the error
            if (this.ideaState?.hotIdeas?.length) {
              return this.renderHotIdeas(this.ideaState.hotIdeas);
            }
            return html`<div class="error">Error loading hot ideas</div>`;
          },
        })}
      </div>
    `;
  }

  private renderHotIdeas(ideas: Idea[]) {
    return html`
      <div class="hot-ideas-list">
        ${ideas.map(
          (idea: Idea) => html`
            <idea-card-small .idea=${idea}></idea-card-small>
          `
        )}
      </div>
    `;
  }
}
