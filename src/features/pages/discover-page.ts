import { customElement, state } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';
import { repeat } from 'lit/directives/repeat.js';
import { cache } from 'lit/directives/cache.js';

import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import '@components/idea/idea-card-large';
import '@components/navigation/search-bar';
import '@components/navigation/create-idea-button';

import { Idea, Solution, IdeaContribution, DiscoverQueryType } from '@/types';

import layout from '@state/layout';
import { watchTag, isWatched } from '@state/user/watched-tags';

import urqlClient from '@utils/urql-client';
import {
  IdeasBySharesDocument,
  IdeasByFundersDocument,
  IdeasByStartTimeDocument,
  SolutionsByDeadlineDocument,
  IdeasFullTextDocument,
  IdeasByTagsDocument,
  IdeasBySharesQuery,
  IdeasByStartTimeQuery,
  SolutionsByDeadlineQuery,
  IdeasByFundersQuery,
  IdeasFullTextQuery,
  IdeasByTagsQuery,
} from '@gql';

type AnyResult =
  | IdeasBySharesQuery
  | IdeasByStartTimeQuery
  | SolutionsByDeadlineQuery
  | IdeasByFundersQuery
  | IdeasFullTextQuery
  | IdeasByTagsQuery;

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
      font-weight: 600;
      font-size: 1.75rem;
      color: var(--section-heading);
    }

    .tag-with-button {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }
  `;

  @state() private search: string | null = null;
  @state() private tab: DiscoverQueryType = 'hot-ideas';
  @state() private tags: string[] = [];
  @state() private results?: Idea[] | Solution[] | IdeaContribution[];
  @state() private isLoading: boolean = false;

  private unsubscribeQuery?: () => void;

  private readonly queries = {
    'hot-ideas': IdeasBySharesDocument,
    'new-ideas': IdeasByStartTimeDocument,
    deadline: SolutionsByDeadlineDocument,
    followed: IdeasByFundersDocument,
    search: IdeasFullTextDocument,
    tags: IdeasByTagsDocument,
  } as const;

  private getVariablesForQuery(queryType: DiscoverQueryType) {
    switch (queryType) {
      case 'hot-ideas':
        return { detailed: true };
      case 'new-ideas':
        return {};
      case 'deadline':
        return {};
      case 'followed':
        return {
          funders: JSON.parse(localStorage.getItem('funders') || '[]'),
        };
      case 'search':
        return {
          text: this.search ?? '', // Ensure text is always string, default to '' if null
        };
      case 'tags':
        return {
          tag1: this.tags[0] || '',
          tag2: this.tags[1] || this.tags[0] || '',
          tag3: this.tags[2] || this.tags[0] || '',
          tag4: this.tags[3] || this.tags[0] || '',
          tag5: this.tags[4] || this.tags[0] || '',
          detailed: true,
        };
      default:
        return {};
    }
  }

  private getResultsFromData(data: AnyResult, queryType: DiscoverQueryType) {
    // Mapping of query types to their corresponding data properties
    switch (queryType) {
      case 'hot-ideas':
        return (data as IdeasBySharesQuery).ideas as Idea[];
      case 'new-ideas':
        return (data as IdeasByStartTimeQuery).ideas as Idea[];
      case 'deadline':
        return (data as SolutionsByDeadlineQuery).solutions as Solution[];
      case 'followed':
        return (data as IdeasByFundersQuery)
          .ideaContributions as IdeaContribution[];
      case 'search':
        return (data as IdeasFullTextQuery).ideaSearch as Idea[];
      case 'tags':
        return (data as IdeasByTagsQuery).ideas as Idea[];
    }
  }

  private subscribe(queryType: DiscoverQueryType) {
    // Clean up previous subscription if it exists
    this.unsubscribeQuery?.();

    this.isLoading = true;
    this.results = undefined;

    const query = this.queries[queryType];
    const variables = this.getVariablesForQuery(queryType);
    const querySub = urqlClient.query(query, variables).subscribe((result) => {
      this.isLoading = false;
      if (result.data) {
        this.results = this.getResultsFromData(result.data, queryType);
      } else {
        this.results = [];
      }
    });

    this.unsubscribeQuery = querySub.unsubscribe;
  }

  private renderTagList() {
    return html`
      <div class="tag-list">
        ${repeat(
          this.tags,
          (tag) => html`
            <span class="tag-with-button">
              <h2 class="tag">${tag}</h2>
              <sl-button
                pill
                size="small"
                @click=${() => watchTag(tag)}
                ?disabled=${isWatched(tag)}
              >
                ${isWatched(tag) ? 'Watched' : 'Watch Tag'}
              </sl-button>
            </span>
          `
        )}
      </div>
    `;
  }

  private setTabFromUrl = () => {
    const url = new URL(window.location.href);
    this.search = url.searchParams.get('search');
    this.tab = url.searchParams.get('tab') as DiscoverQueryType;

    if (!this.tab) {
      // If there's a search term and no tab is specified, set tab to 'search'
      if (this.search && this.search.trim() !== '') {
        if (this.search.startsWith('[')) {
          this.tab = 'tags';
          const tagMatches = this.search?.match(/\[.*?]/g) || [];
          this.tags = tagMatches
            .map((tag) => tag.replace(/[\[\]]/g, ''))
            .slice(0, 5); // only get up to 5 matches
        } else {
          this.tab = 'search';
        }
      } else {
        // If no tab or search is specified, default to 'hot-ideas'
        this.tab = 'hot-ideas';
      }
    }

    this.subscribe(this.tab);
  };

  private renderQueryResults() {
    if (this.isLoading) {
      return html` <sl-spinner></sl-spinner>`;
    }

    if (!this.results?.length) {
      return html`<p>No results found</p>`;
    }

    // Type handling based on the current tab/query type
    if (
      this.tab === 'hot-ideas' ||
      this.tab === 'new-ideas' ||
      this.tab === 'search' ||
      this.tab === 'tags'
    ) {
      // Ideas result type
      return html`${repeat(
        this.results as Idea[],
        (idea) => idea.id,
        (idea) => html` <idea-card-large .idea=${idea}></idea-card-large>`
      )}`;
    } else if (this.tab === 'deadline') {
      // Solutions result type
      return html`${repeat(
        this.results as Solution[],
        (solution) => solution.id,
        (solution) =>
          html` <solution-card .solution=${solution}></solution-card>`
      )}`;
    } else if (this.tab === 'followed') {
      // IdeaContribution result type
      return html`${repeat(
        this.results as IdeaContribution[],
        (contribution) => contribution.id,
        (contribution) =>
          html` <idea-card-large .idea=${contribution.idea}></idea-card-large>`
      )}`;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.setTabFromUrl();
    window.addEventListener('popstate', this.setTabFromUrl);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // Listen for URL changes that aren't caught by popstate
    // This is needed for when users click on tags in idea cards
    this._handleUrlChange = this._handleUrlChange.bind(this);
    this._setupUrlChangeListener();
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.setTabFromUrl);
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
    this._teardownUrlChangeListener();
    this.unsubscribeQuery?.();
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

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.unsubscribeQuery?.();
    } else {
      this.subscribe(this.tab);
    }
  };

  render() {
    layout.topBarContent.set(html`
      <create-idea-button></create-idea-button>
      <div>
        <discover-tabs .tab=${this.tab}></discover-tabs>
        <search-bar .search=${this.search}></search-bar>
      </div>
    `);
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(true);
    layout.rightSidebarContent.set(html`
      <popular-tags></popular-tags>
      <watched-tags></watched-tags>
    `);

    return html`
      <div class="container">
        <main>
          ${this.tab === 'tags' ? this.renderTagList() : html``}
          ${cache(this.renderQueryResults())}
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
