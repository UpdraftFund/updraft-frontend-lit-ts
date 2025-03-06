import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { Task } from '@lit/task';
import { consume } from '@lit/context';
import { SignalWatcher } from '@lit-labs/signals';
import { repeat } from 'lit/directives/repeat.js';

import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

import '@layout/top-bar';
import '@layout/left-side-bar';
import '@layout/right-side-bar';
import '@components/search-bar';
import '@components/idea-card-large';

import { connectionContext, watchedTags, watchTag } from '@/context.ts';
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
export class DiscoverPage extends SignalWatcher(LitElement) {

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

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .tag {
      font-weight: 500;
      font-size: 1.3rem;
    }

    .tag-with-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
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
    'hot-ideas': () => ({ detailed: true }),
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
      this.tags = tagMatches.map(tag => tag.replace(/[\[\]]/g, ''))
        .slice(0, 5); // only get up to 5 matches
      const defaultTag = this.tags[0] || '';
      return {
        tag1: this.tags[0] || defaultTag,
        tag2: this.tags[1] || defaultTag,
        tag3: this.tags[2] || defaultTag,
        tag4: this.tags[3] || defaultTag,
        tag5: this.tags[4] || defaultTag,
        detailed: true,
      };
    }
  };

  private readonly resultEntities: Record<QueryType, string> = {
    'hot-ideas': 'ideas',
    'new-ideas': 'ideas',
    'deadline': 'solutions',
    'followed': 'ideaContributions',
    'search': 'ideaSearch',
    'tags': 'ideas',
  }

  private readonly results = new Task(this, {
    task: async ([tab, search]): Promise<{ data: any, entity: string } | undefined> => {
      this.queryType = tab;
      if (this.queryType === 'search' && search?.startsWith('[')) {
        this.queryType = 'tags';
      }
      const query = this.queryType && this.queries[this.queryType];
      if (query) {
        const variables = this.variables[this.queryType!]?.() || {};
        const result = await urqlClient.query(query, variables);
        return {
          data: result.data,
          entity: this.resultEntities[this.queryType!],
        }
      }
    },
    args: () => [this.tab, this.search] as const
  });

  @consume({ context: connectionContext, subscribe: true }) connection!: Connection;

  @property() tab: QueryType='hot-ideas';
  @property() search?: string;

  private queryType?: QueryType;
  private tags: string[] = [];

  private renderTagList() {
    return html`
      <div class="tag-list">
        ${repeat(
            this.tags,
            (tag) => tag,
            (tag) => html`
              <span class="tag-with-button">
                <span class="tag">${tag}</span>
                <sl-button pill size="small"
                           @click=${() => watchTag(tag)}
                           ?disabled=${watchedTags.get().includes(tag)}
                >
                  ${watchedTags.get().includes(tag) ? 'Watched' : 'Watch Tag'}
                </sl-button>
              </span>
            `
        )}
      </div>
    `;
  }

  private handleTab(e: any) {
    this.tab = e?.detail?.name;
    if(this.tab) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', this.tab);
      if (window.location.href !== url.toString()) { // don't push the same URL twice
        window.history.pushState({}, '', url.toString());
      }
    }
  }

  private setTabFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    this.tab = urlParams.get('tab') as QueryType || 'hot-ideas';
  }

  connectedCallback() {
    super.connectedCallback();
    this.setTabFromUrl();
    window.addEventListener('popstate', this.setTabFromUrl);
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.setTabFromUrl);
    super.disconnectedCallback();
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
            complete: (result) => {
              if (result) {
                const data = result.data?.[result.entity] || [] as ResultType[];
                return html`
                  ${this.queryType === 'tags' ? this.renderTagList() : ''}
                  ${data.map((item: ResultType) => {
                    switch (result.entity) {
                      case 'ideas':
                        return html`
                          <idea-card-large .idea=${item}></idea-card-large>`;
                      case 'ideaSearch':
                        return html`
                          <idea-card-large .idea=${item}></idea-card-large>`;
                      case 'solutions':
                        return html`
                          <solution-card .solution=${item}></solution-card>`;
                      case 'ideaContributions':
                        return html`
                          <idea-card-large .idea=${(item as unknown as IdeaContribution).idea}></idea-card-large>`;
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
