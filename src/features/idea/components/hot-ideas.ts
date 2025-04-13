import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
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

  @state() private hotIdeas?: Idea[];
  private unsubHotIdeas?: () => void;

  private subscribe() {
    this.unsubHotIdeas?.();

    const hotIdeasSub = urqlClient
      .query(IdeasBySharesDocument, {})
      .subscribe((result) => {
        if (result.data?.ideas) {
          this.hotIdeas = result.data.ideas as Idea[];
        } else {
          this.hotIdeas = [];
        }
      });

    this.unsubHotIdeas = hotIdeasSub.unsubscribe;
  }

  connectedCallback() {
    super.connectedCallback();
    this.subscribe();
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
    if (document.hidden) {
      this.unsubHotIdeas?.();
    } else {
      this.subscribe();
    }
  };

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
        ${this.hotIdeas === undefined
          ? html` <sl-spinner></sl-spinner>`
          : cache(
              this.hotIdeas.length === 0
                ? html` <div class="no-ideas">No hot ideas found</div>`
                : this.renderHotIdeas(this.hotIdeas)
            )}
      </div>
    `;
  }
}
