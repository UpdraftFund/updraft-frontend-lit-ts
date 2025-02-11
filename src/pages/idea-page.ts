import { customElement, property } from 'lit/decorators.js';
import { html, css, LitElement } from 'lit';
import { Task } from '@lit/task';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
dayjs.extend(relativeTime);
dayjs.extend(utc);

import '@layout/top-bar';
import '@layout/left-side-bar';
import '@components/page-specific/idea-side-bar';

import urqlClient from '@/urql-client';
import { IdeaDocument } from '@gql';
import { Idea } from '@/types';
import { fromHex } from "viem";

@customElement('idea-page')
export class IdeaPage extends LitElement {
  static styles = css`
    .container {
      display: flex;
      flex: 1 1 auto;
      overflow: hidden;
    }

    left-side-bar {
      flex: 0 0 274px;
    }

    idea-side-bar {
      flex: 0 0 300px;
    }

    main {
      flex: 1;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: .5rem 1rem;
      color: var(--main-foreground);
      background: var(--main-background);
    }

    .tags {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .tag {
      background: var(--sl-color-neutral-100);
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      color: var(--sl-color-neutral-700);
    }

    @media (max-width: 1415px) {
      left-side-bar {
        flex: 0 0 0;
        pointer-events: none;
      }
    }

    @media (max-width: 1130px) {
      idea-side-bar {
        flex: 0 0 0;
        pointer-events: none;
      }
    }

  `;

  @property() ideaId!: string;

  //TODO: each url should include a network
  //@property() network: string;

  private readonly idea = new Task(this, {
    task: async ([ideaId]) => {
      const result = await urqlClient.query(IdeaDocument, { ideaId });
      return result.data?.idea as Idea;
    },
    args: () => [this.ideaId] as const
  });

  render() {
    return html`
      <top-bar></top-bar>
      <div class="container">
        <left-side-bar></left-side-bar>
        <main>
          ${this.idea.render({
            complete: (idea: Idea) => {
              const { startTime, funderReward, shares, creator, tags } = idea;
              const profile = JSON.parse(fromHex(creator.profile as `0x${string}`, 'string'));
              const date = dayjs(startTime * 1000);
              return html`
                <h2>Idea: ${idea.name}</h2>
                <a href="/profile/${creator.id}"><p>by ${profile.name || creator.id}</p></a>
                <span>Created ${date.format('MMM D, YYYY [at] h:mm A UTC')} (${date.fromNow()})</span>
                <span>${funderReward}</span>
                <span>${shares}</span>
                ${tags ? html`
                  <div class="tags">
                    ${tags.map((tag) => html`<span class="tag">${tag}</span>`)}
                  </div>
                ` : ''}
              `
            }
          })}
        </main>
        <idea-side-bar></idea-side-bar>
      </div>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'idea-page': IdeaPage;
  }
}
