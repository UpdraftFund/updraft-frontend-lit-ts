import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { Task } from '@lit/task';
import { consume } from '@lit/context';
import { SignalWatcher } from '@lit-labs/signals';

import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

import '@components/idea/idea-card-large';
import '@components/navigation/search-bar';
import '@components/navigation/create-idea-button';

import { Connection, Idea, Solution, IdeaContribution } from '@/types';

import { connectionContext } from '@/features/common/state/context';
import { topBarContent } from '@state/layout/layout.ts';

import urqlClient from '@/features/common/utils/urql-client.ts';
import {
  IdeasBySharesDocument,
  IdeasByFundersDocument,
  IdeasByStartTimeDocument,
  SolutionsByDeadlineDocument,
  IdeasFullTextDocument,
  IdeasByTagsDocument,
} from '@gql';

type QueryType =
  | 'hot-ideas'
  | 'new-ideas'
  | 'deadline'
  | 'followed'
  | 'search'
  | 'tags';

type ResultType = Idea[] | Solution[] | IdeaContribution[];

@customElement('discover-page')
export class DiscoverPage extends SignalWatcher(LitElement) {
  static styles = css`
    .container {
      display: flex;
      flex: auto;
      overflow: hidden;
      background: linear-gradient(
        to bottom,
        var(--subtle-background),
        var(--main-background)
      );
    }

    main {
      flex: 1;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.5rem 1rem;
      color: var(--main-foreground);
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
  `;

  private readonly queries = {
    'hot-ideas': IdeasBySharesDocument,
    'new-ideas': IdeasByStartTimeDocument,
    deadline: SolutionsByDeadlineDocument,
    followed: IdeasByFundersDocument,
    search: IdeasFullTextDocument,
    tags: IdeasByTagsDocument,
  } as const;

  private readonly variables = {
    'hot-ideas': () => ({ detailed: true }),
    'new-ideas': () => ({}),
    deadline: () => ({}),
    followed: () => ({
      funders: JSON.parse(localStorage.getItem('funders') || '[]'),
    }),
    search: () => ({
      text: this.search,
    }),
    tags: () => {
      const tagMatches = this.search?.match(/\[.*?\]/g) || [];
      this.tags = tagMatches
        .map((tag) => tag.replace(/[\[\]]/g, ''))
        .slice(0, 5); // only get up to 5 matches
      const defaultTag = this.tags[0] || '';

      // If no tags are found, return a default structure with empty strings
      if (this.tags.length === 0) {
        return {
          tag1: '',
          tag2: '',
          tag3: '',
          tag4: '',
          tag5: '',
          detailed: true,
        };
      }

      return {
        tag1: this.tags[0] || defaultTag,
        tag2: this.tags[1] || defaultTag,
        tag3: this.tags[2] || defaultTag,
        tag4: this.tags[3] || defaultTag,
        tag5: this.tags[4] || defaultTag,
        detailed: true,
      };
    },
  };

  private readonly resultEntities: Record<QueryType, string> = {
    'hot-ideas': 'ideas',
    'new-ideas': 'ideas',
    deadline: 'solutions',
    followed: 'ideaContributions',
    search: 'ideaSearch',
    tags: 'ideas',
  };

  private readonly results = new Task(this, {
    task: async ([tab, search]): Promise<
      { data: Record<string, unknown> | undefined; entity: string } | undefined
    > => {
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
        };
      }
    },
    args: () => [this.tab, this.search] as const,
  });

  @consume({ context: connectionContext, subscribe: true })
  connection!: Connection;

  @property() tab?: QueryType;
  @property() search?: string;

  private queryType?: QueryType;
  private tags: string[] = [];

  private setTabFromUrl = () => {
    const urlParams = new URLSearchParams(window.location.search);
    this.search = urlParams.get('search') || undefined;
    this.tab = (urlParams.get('tab') as QueryType) || undefined;

    // If there's a search term and no tab is specified, set tab to 'search'
    if (this.search && !this.tab) {
      this.tab = 'search';
    }

    // If tab is 'search' but there's no search term, default to 'hot-ideas'
    if (this.tab === 'search' && !this.search) {
      this.tab = 'hot-ideas';
      // Update URL to reflect the new tab
      const url = new URL(window.location.href);
      url.searchParams.set('tab', this.tab);
      window.history.replaceState({}, '', url.toString());
    }

    // If no tab is specified, default to 'hot-ideas'
    if (!this.tab) {
      this.tab = 'hot-ideas';
    }
  };

  connectedCallback() {
    super.connectedCallback();
    this.setTabFromUrl();
    window.addEventListener('popstate', this.setTabFromUrl);

    // Listen for URL changes that aren't caught by popstate
    // This is needed for when users click on tags in idea cards
    this._handleUrlChange = this._handleUrlChange.bind(this);
    this._setupUrlChangeListener();
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.setTabFromUrl);
    this._teardownUrlChangeListener();
    super.disconnectedCallback();
  }

  private _lastUrl = window.location.href;
  private _urlChangeInterval?: number;

  private _setupUrlChangeListener() {
    // Check for URL changes every 100ms
    this._urlChangeInterval = window.setInterval(this._handleUrlChange, 100);
  }

  private _teardownUrlChangeListener() {
    if (this._urlChangeInterval) {
      clearInterval(this._urlChangeInterval);
    }
  }

  private _handleUrlChange() {
    const currentUrl = window.location.href;
    if (this._lastUrl !== currentUrl) {
      this._lastUrl = currentUrl;

      // Only update if we're still on the discover page
      if (window.location.pathname === '/discover') {
        this.setTabFromUrl();
      }
    }
  }

  render() {
    topBarContent.set(
      html` <div>
          <discover-tabs></discover-tabs>
          <search-bar></search-bar>
        </div>
        <create-idea-button></create-idea-button>`
    );
    return html`
      <div class="container">
        <main>
          ${this.results.render({
            complete: (result) => {
              if (result) {
                const data = (result.data?.[result.entity] ||
                  []) as ResultType[];
                return html`
                  ${data.map((item: ResultType) => {
                    switch (result.entity) {
                      case 'ideas':
                        return html` <idea-card-large
                          .idea=${item}
                        ></idea-card-large>`;
                      case 'ideaSearch':
                        return html` <idea-card-large
                          .idea=${item}
                        ></idea-card-large>`;
                      case 'solutions':
                        return html` <solution-card
                          .solution=${item}
                        ></solution-card>`;
                      case 'ideaContributions':
                        return html` <idea-card-large
                          .idea=${(item as unknown as IdeaContribution).idea}
                        ></idea-card-large>`;
                    }
                  })}
                `;
              }
              return '';
            },
            initial: () => html` <loading-spinner></loading-spinner>`,
            error: (error) => html`<p>Error: ${error}</p>`,
          })}
        </main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'discover-page': DiscoverPage;
  }
}
