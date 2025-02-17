import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { consume } from "@lit/context";
import { Task } from '@lit/task';

import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@layout/top-bar';
import '@layout/left-side-bar';
import '@components/search-bar';

import { connectionContext } from '@/context.ts';
import { Connection, Idea, Solution } from "@/types";

import urqlClient from "@/urql-client.ts";
import {
  IdeasBySharesDocument,
  IdeasByFundersDocument,
  IdeasByStartTimeDocument,
  SolutionsByDeadlineDocument,
  IdeasFullTextDocument,
  IdeasByTagsDocument,
} from "@gql";

type QueryType = 'hot-ideas' | 'new-ideas' | 'deadline' | 'followed' | 'search' | 'tags';

@customElement('discover-page')
export class DiscoverPage extends LitElement {

  static styles = css`

    .search-tabs {
      display: flex;
      align-items: center;
      flex: 1;
      justify-content: center;
    }

    .container {
      display: flex;
      flex: auto;
      overflow: hidden;
    }

    left-side-bar {
      flex: 0 0 274px;
    }

    main {
      flex: 1;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: .2rem;
      padding: .5rem 1rem;
      color: var(--main-foreground);
      background: var(--main-background);
    }
  `;

  private readonly queries = {
    'hot-ideas': IdeasBySharesDocument,
    'new-ideas': IdeasByStartTimeDocument,
    'deadline': SolutionsByDeadlineDocument,
    'followed': IdeasByFundersDocument,
    'search': IdeasFullTextDocument,
    'tags': IdeasByTagsDocument,
  } as const;

  private readonly variables = {
    'hot-ideas': () => ({}),
    'new-ideas': () => ({}),
    'deadline': () => ({}),
    'followed': () => ({
      funders: JSON.parse(localStorage.getItem('funders') || '[]')
    }),
    'search': () => ({
      text: this.search
    }),
    'tags': () => {
      const tagMatches = this.search?.match(/\[.*?\]/g) || [];
      const tags = tagMatches.map(tag => tag.replace(/[\[\]]/g, ''))
        .slice(0, 5); // only get up to 5 matches
      const defaultTag = tags[0] || '';
      return {
        tag1: tags[0] || defaultTag,
        tag2: tags[1] || defaultTag,
        tag3: tags[2] || defaultTag,
        tag4: tags[3] || defaultTag,
        tag5: tags[4] || defaultTag
      };
    }
  };

  private readonly resultEntities = {
    'hot-ideas': 'ideas',
    'new-ideas': 'ideas',
    'deadline': 'solutions',
    'followed': 'ideaContributions',
    'search': 'ideaSearch',
    'tags': 'ideas',
  }

  private readonly results = new Task(this, {
    task: async ([tab]): Promise<any | void> => {
      let queryType = tab;
      if (queryType === 'search' && this.search?.startsWith('[')){
        queryType = 'tags';
      }
      const query = queryType && this.queries[queryType];
      if (query) {
        const variables = this.variables[queryType!]?.() || {};
        const result = await urqlClient.query(query, variables);
        return result.data;
      }
    },
    args: () => [this.tab, this.search] as const
  });

  @consume({ context: connectionContext, subscribe: true }) connection!: Connection;

  @property() tab: QueryType | null = null;
  @property() search: string | null = null;

  private handleTab(e: any) {
    this.tab = e.detail.name;
  }

  render() {
    return html`
      <top-bar>
        <span class="search-tabs">
          <sl-tab-group @sl-tab-show=${this.handleTab}>
            <sl-tab slot="nav" panel="hot-ideas" .active=${this.tab === 'hot-ideas'}>Hot Ideas</sl-tab>
            <sl-tab slot="nav" panel="new-ideas" .active=${this.tab === 'new-ideas'}>New Ideas</sl-tab>
            <sl-tab slot="nav" panel="deadline" .active=${this.tab === 'deadline'}>Deadline</sl-tab>
            <sl-tab slot="nav" panel="followed" .active=${this.tab === 'followed'}>Followed</sl-tab>
            <sl-tab slot="nav" panel="search" .active=${this.tab === 'search'}>Search</sl-tab>
          </sl-tab-group>
          <search-bar value=${this.search}></search-bar>
        </span>
      </top-bar>
      <div class="container">
        <left-side-bar location="discover"></left-side-bar>
        <main>
          ${this.results.render({
            complete: (data) => {
              const result = data?.[this.resultEntities[this.tab!]] || [];
              return html`
                ${result.map((idea: Idea | Solution) => html`
                  <idea-card .idea=${idea}></idea-card>
                `)}
              `
            }
          })}
        </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'discover-page': DiscoverPage;
  }
}
