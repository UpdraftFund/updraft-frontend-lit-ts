import { customElement, state } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';
import { repeat } from 'lit/directives/repeat.js';
import { cache } from 'lit/directives/cache.js';
import dayjs from 'dayjs';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js';
import '@shoelace-style/shoelace/dist/components/tab/tab.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

// Components
import '@components/navigation/create-idea-button';
import '@components/navigation/search-bar';
import '@components/navigation/discover-tabs';
import '@components/tags/popular-tags';
import '@components/tags/watched-tags';
import '@components/idea/idea-card-large';
import '@components/solution/solution-card-large';

// State
import layout from '@state/layout';
import { watchTag, isWatched } from '@state/user/watched-tags';
import { followedUsers } from '@state/user/follow';

// Utils
import { UrqlQueryController } from '@utils/urql-query-controller';
import { sortIdeasByNewest } from '@utils/idea/sort-ideas';

// GraphQL
import {
  IdeasBySharesDocument,
  IdeasByFundersDocument,
  IdeasByStartTimeDocument,
  SolutionsBySweetnessDocument,
  IdeasFullTextDocument,
  IdeasByTagsDocument,
  IdeasBySharesQuery,
  IdeasByStartTimeQuery,
  SolutionsBySweetnessQuery,
  IdeasByFundersQuery,
  IdeasFullTextQuery,
  IdeasByTagsQuery,
  IdeasBySharesQueryVariables,
  IdeasByStartTimeQueryVariables,
  SolutionsBySweetnessQueryVariables,
  IdeasByFundersQueryVariables,
  IdeasFullTextQueryVariables,
  IdeasByTagsQueryVariables,
} from '@gql';
import { TypedDocumentNode } from '@urql/core';
import { Idea, Solution, IdeaContribution, DiscoverQueryType } from '@/types';

type AnyResult =
  | IdeasBySharesQuery
  | IdeasByStartTimeQuery
  | SolutionsBySweetnessQuery
  | IdeasByFundersQuery
  | IdeasFullTextQuery
  | IdeasByTagsQuery;

type AnyVariables =
  | IdeasBySharesQueryVariables
  | IdeasByStartTimeQueryVariables
  | SolutionsBySweetnessQueryVariables
  | IdeasByFundersQueryVariables
  | IdeasFullTextQueryVariables
  | IdeasByTagsQueryVariables;

@customElement('discover-page')
export class DiscoverPage extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      align-items: center;
      background: var(--main-background);
      color: var(--main-foreground);
    }

    main {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 0.2rem;
      padding: 0.5rem 0.5rem 0.5rem 2rem;
      max-width: 60rem;
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .tag {
      font-weight: 600;
      font-size: 1.5rem;
      color: var(--section-heading);
    }

    .tag-with-button {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .no-results {
      color: var(--no-results);
      font-style: italic;
    }

    .load-more-container {
      display: flex;
      justify-content: center;
      padding: 2rem 0;
      margin-top: 1rem;
    }

    .load-more-container sl-button {
      min-width: 200px;
    }

    @media (max-width: 768px) {
      main {
        padding: 0.5rem 0 0.5rem 0.5rem;
      }
    }
  `;

  @state() private search: string | null = null;
  @state() private tab: DiscoverQueryType = 'hot-ideas';
  @state() private tags: string[] = [];
  @state() private results?: Idea[] | Solution[] | IdeaContribution[];
  @state() private isLoading = false;
  @state() private dropTabBar = false;
  @state() private currentSkip = 0;
  @state() private hasMoreResults = true;
  @state() private isLoadingMore = false;

  private readonly PAGE_SIZE = 10;

  private readonly queries = {
    'hot-ideas': IdeasBySharesDocument,
    'new-ideas': IdeasByStartTimeDocument,
    solutions: SolutionsBySweetnessDocument,
    followed: IdeasByFundersDocument,
    search: IdeasFullTextDocument,
    tags: IdeasByTagsDocument,
  } as const;

  // Controller for handling query subscriptions
  private readonly queryController = new UrqlQueryController<
    AnyResult,
    AnyVariables
  >(
    this,
    this.queries['hot-ideas'], // default
    this.getVariablesForQuery('hot-ideas'), // default
    (result) => {
      this.isLoading = false;
      this.isLoadingMore = false;
      if (result.data) {
        const newResults = this.getResultsFromData(result.data, this.tab);
        if (
          // First page
          this.currentSkip === 0 ||
          // First two pages of hot-ideas to account for sub-sorting
          (this.tab === 'hot-ideas' && this.currentSkip <= this.PAGE_SIZE)
        ) {
          this.results = newResults;
        } else {
          // Pagination load - append results
          if (this.results && newResults) {
            // Type-safe concatenation based on the current tab
            if (
              this.tab === 'hot-ideas' ||
              this.tab === 'new-ideas' ||
              this.tab === 'search' ||
              this.tab === 'tags' ||
              this.tab === 'followed'
            ) {
              this.results = [
                ...(this.results as Idea[]),
                ...(newResults as Idea[]),
              ];
            } else if (this.tab === 'solutions') {
              this.results = [
                ...(this.results as Solution[]),
                ...(newResults as Solution[]),
              ];
            }
          }
        }
        this.hasMoreResults = newResults.length >= this.PAGE_SIZE;
      } else {
        // No results
        if (this.currentSkip === 0) {
          this.results = [];
        }
        this.hasMoreResults = false;
      }
    }
  );

  private getVariablesForQuery(queryType: DiscoverQueryType) {
    let first = this.PAGE_SIZE;
    let skip = this.currentSkip;
    switch (queryType) {
      case 'hot-ideas':
        if (this.currentSkip <= this.PAGE_SIZE) {
          // for the first two pages, get twice the results and sub-sort by date
          first *= 2;
          skip = 0;
        }
        return { first, skip, detailed: true };
      case 'new-ideas':
        return { first, skip };
      case 'solutions':
        return { first, skip, now: dayjs().unix() };
      case 'followed':
        const fundersArray = Array.from(followedUsers.get());
        return {
          first,
          skip,
          funders: fundersArray.length > 0 ? fundersArray : ['0x01'],
        };
      case 'search':
        return {
          first,
          skip,
          text: this.search ?? '', // Ensure text is always string, default to '' if null
        };
      case 'tags':
        return {
          first,
          skip,
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
        const ideasByShares = (data as IdeasBySharesQuery).ideas as Idea[];
        // For the third and subsequent pages, return results as normal
        if (this.currentSkip > this.PAGE_SIZE) {
          return ideasByShares;
        }
        // For the first two pages, get ideas ordered by shares, then sub-sort by newest first
        // For page one, we need PAGE_SIZE results; for page two, we need twice that
        let numResults = this.PAGE_SIZE;
        if (this.currentSkip > 0) {
          numResults *= 2;
        }
        return sortIdeasByNewest(ideasByShares, numResults);
      case 'new-ideas':
        return (data as IdeasByStartTimeQuery).ideas as Idea[];
      case 'solutions':
        return (data as SolutionsBySweetnessQuery).solutions as Solution[];
      case 'followed':
        // Dedupe Ideas from IdeaContributions
        const ideaContributions = (data as IdeasByFundersQuery)
          .ideaContributions as IdeaContribution[];
        const uniqueIdeasMap = new Map<string, Idea>();
        ideaContributions.forEach((contribution) => {
          uniqueIdeasMap.set(contribution.idea.id, contribution.idea);
        });
        return Array.from(uniqueIdeasMap.values());
      case 'search':
        return (data as IdeasFullTextQuery).ideaSearch as Idea[];
      case 'tags':
        return (data as IdeasByTagsQuery).ideas as Idea[];
    }
  }

  private subscribe() {
    this.isLoading = true;
    this.results = undefined;
    this.currentSkip = 0;
    this.hasMoreResults = true;

    const query = this.queries[this.tab] as TypedDocumentNode<
      AnyResult,
      AnyVariables
    >;
    const variables = this.getVariablesForQuery(this.tab);
    this.queryController.setQueryAndSubscribe(query, variables);
  }

  private loadMore() {
    if (!this.hasMoreResults || this.isLoadingMore) return;

    this.isLoadingMore = true;
    this.currentSkip += this.PAGE_SIZE;

    const query = this.queries[this.tab] as TypedDocumentNode<
      AnyResult,
      AnyVariables
    >;
    const variables = this.getVariablesForQuery(this.tab);
    this.queryController.setQueryAndSubscribe(query, variables);
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

    this.subscribe();
  };

  private renderQueryResults() {
    if (this.isLoading) {
      return html` <sl-spinner></sl-spinner>`;
    }

    if (!this.results?.length) {
      return html`<p class="no-results">No results found</p>`;
    }

    let resultsContent;

    // Type handling based on the current tab/query type
    if (
      this.tab === 'hot-ideas' ||
      this.tab === 'new-ideas' ||
      this.tab === 'search' ||
      this.tab === 'tags' ||
      this.tab === 'followed'
    ) {
      // Ideas result type
      resultsContent = cache(
        html`${repeat(
          this.results as Idea[],
          (idea) => idea.id,
          (idea) => html` <idea-card-large .idea=${idea}></idea-card-large>`
        )}`
      );
    } else if (this.tab === 'solutions') {
      // Solutions result type
      resultsContent = cache(
        html`${repeat(
          this.results as Solution[],
          (solution) => solution.id,
          (solution) =>
            html` <solution-card-large
              .solution=${solution}
            ></solution-card-large>`
        )}`
      );
    }

    return html` ${resultsContent} ${this.renderLoadMoreButton()} `;
  }

  private renderLoadMoreButton() {
    if (!this.hasMoreResults) {
      return html``;
    }

    return html`
      <div class="load-more-container">
        <sl-button
          variant="default"
          size="medium"
          ?loading=${this.isLoadingMore}
          @click=${this.loadMore}
        >
          ${this.isLoadingMore ? 'Loading...' : 'Load more results...'}
        </sl-button>
      </div>
    `;
  }

  private narrowScreenMediaQuery = window.matchMedia('(max-width: 768px)');

  private handleMediaQueryChange() {
    if (this.narrowScreenMediaQuery.matches) {
      layout.topBarContent.set(html`
        <create-idea-button></create-idea-button>
        <search-bar .search=${this.search}></search-bar>
      `);
      this.dropTabBar = true;
    } else {
      layout.topBarContent.set(html`
        <create-idea-button></create-idea-button>
        <div class="tabs-and-search">
          <discover-tabs .tab=${this.tab}></discover-tabs>
          <search-bar .search=${this.search}></search-bar>
        </div>
      `);
      this.dropTabBar = false;
    }
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

  connectedCallback() {
    super.connectedCallback();

    this.setTabFromUrl();

    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(true);
    layout.rightSidebarContent.set(html`
      <popular-tags></popular-tags>
      <watched-tags></watched-tags>
    `);

    window.addEventListener('popstate', this.setTabFromUrl);
    // Listen for URL changes that aren't caught by popstate
    // This is needed for when users click on tags in idea cards
    this._handleUrlChange = this._handleUrlChange.bind(this);
    this._setupUrlChangeListener();

    this.handleMediaQueryChange();
    this.narrowScreenMediaQuery.addEventListener(
      'change',
      this.handleMediaQueryChange.bind(this)
    );
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.setTabFromUrl);
    this._teardownUrlChangeListener();
    this.narrowScreenMediaQuery.removeEventListener(
      'change',
      this.handleMediaQueryChange.bind(this)
    );
    super.disconnectedCallback();
  }

  render() {
    return html`
      ${this.dropTabBar
        ? html` <discover-tabs .tab=${this.tab}></discover-tabs>`
        : html``}
      <main>
        ${this.tab === 'tags' ? this.renderTagList() : html``}
        ${this.renderQueryResults()}
      </main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'discover-page': DiscoverPage;
  }
}
