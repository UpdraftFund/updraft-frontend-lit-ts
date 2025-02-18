import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { Task } from '@lit/task';
import { consume } from '@lit/context';

import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@layout/top-bar';
import '@layout/left-side-bar';
import '@layout/right-side-bar';
import '@components/search-bar';
import '@components/idea-card-small';

import { connectionContext } from '@/context.ts';
import { Connection, Idea, Solution, IdeaContribution } from "@/types";

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
type ResultType = Idea[] | Solution[] | IdeaContribution[];

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
      background: linear-gradient(to bottom, var(--subtle-background), var(--main-background));
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
      border-radius: 25px 25px 0 0;
      background: var(--main-background);
    }

    right-side-bar {
      flex: 0 0 300px;
      border-radius: 0 0 0 25px;
      background: var(--subtle-background);
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

  private readonly resultEntities : Record<QueryType, string> = {
    'hot-ideas': 'ideas',
    'new-ideas': 'ideas',
    'deadline': 'solutions',
    'followed': 'ideaContributions',
    'search': 'ideaSearch',
    'tags': 'ideas',
  }

  private readonly results = new Task(this, {
    task: async ([tab, search]) : Promise<{ data: any, entity: string } | undefined>=> {
      let queryType = tab;
      if (queryType === 'search' && search?.startsWith('[')){
        queryType = 'tags';
      }
      const query = queryType && this.queries[queryType];
      if (query) {
        const variables = this.variables[queryType!]?.() || {};
        const result = await urqlClient.query(query, variables);
        return {
          data: result.data,
          entity: this.resultEntities[queryType!],
        }
      }
    },
    args: () => [this.tab, this.search] as const
  });

  @consume({ context: connectionContext, subscribe: true }) connection!: Connection;

  @property() tab?: QueryType;
  @property() search?: string;

  private handleTab(e: any) {
    this.tab = e?.detail?.name;
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
            complete: ( result ) => {
              if (result) {
                const data = result.data?.[result.entity] || [] as ResultType[];
                return html`
                  ${data.map((item: ResultType) => {
                    switch (result.entity) {
                      case 'ideas':
                        return html`<idea-card-small .idea=${item}></idea-card-small>`;
                      case 'solutions':
                        return html`<solution-card .solution=${item}></solution-card>`;
                      case 'ideaContributions':
                        return html`<contribution-card .contribution=${item}></contribution-card>`;
                      default:
                        return html`<p>Unknown item type</p>`;
                    }
                  })}
                `;
              }
            }
          })}
        </main>
        <right-side-bar></right-side-bar>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'discover-page': DiscoverPage;
  }
}
