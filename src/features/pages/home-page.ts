import { customElement, state } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { SignalWatcher } from '@lit-labs/signals';

import '@shoelace-style/shoelace/dist/components/button/button.js';

import '@components/navigation/search-bar';
import '@components/navigation/create-idea-button';
import '@pages/home/components/tracked-changes';
import '@pages/home/components/beginner-tasks';

import urqlClient from '@utils/urql-client';
import { UserIdeasSolutionsDocument } from '@gql';

import { userAddress } from '@state/user';
import layout from '@state/layout';

/**
 * Home page component that displays tracked changes and beginner tasks.
 */
@customElement('home-page')
export class HomePage extends SignalWatcher(LitElement) {
  static styles = css`
    .container {
      display: flex;
      flex: 1;
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

    .connect-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 2rem;
      text-align: center;
    }
  `;

  @state() private loading = false;
  @state() private ideaIds: string[] = [];
  @state() private solutionIds: string[] = [];

  // Subscription cleanup
  private unsubIdeasSolutions?: () => void;

  // Track the current user address to detect changes
  private lastUserAddress: string | null = null;

  private subscribeToUserIdeasSolutions(address: string | null) {
    // Clean up previous subscription if it exists
    this.unsubIdeasSolutions?.();

    if (!address) {
      console.log('No user address found');
      this.loading = false;
      this.ideaIds = [];
      this.solutionIds = [];
      return;
    }

    this.loading = true;

    console.log('Subscribing to ideas and solutions for user:', address);

    const subscription = urqlClient
      .query(UserIdeasSolutionsDocument, {
        userId: address,
      })
      .subscribe((result) => {
        this.loading = false;

        if (result.error) {
          console.error(
            'Error fetching user ideas and solutions:',
            result.error
          );
          this.ideaIds = [];
          this.solutionIds = [];
          return;
        }

        // Extract idea IDs
        const extractedIdeaIds =
          result.data?.fundedIdeas?.map(
            (contribution) => contribution.idea.id
          ) || [];

        // Extract and combine solution IDs
        const createdSolutionIds =
          result.data?.createdSolutions?.map((solution) => solution.id) || [];
        const fundedSolutionIds =
          result.data?.fundedSolutions?.map(
            (contribution) => contribution.solution.id
          ) || [];

        const uniqueSolutionIds = [
          ...new Set([...createdSolutionIds, ...fundedSolutionIds]),
        ];

        console.log('User ideas:', extractedIdeaIds);
        console.log('User solutions:', uniqueSolutionIds);

        this.ideaIds = extractedIdeaIds;
        this.solutionIds = uniqueSolutionIds;
      });

    this.unsubIdeasSolutions = subscription.unsubscribe;
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.unsubIdeasSolutions?.();
    } else {
      this.subscribeToUserIdeasSolutions(userAddress.get());
    }
  };

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubIdeasSolutions?.();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
  }

  render() {
    const currentUserAddress = userAddress.get();
    if (this.lastUserAddress !== currentUserAddress) {
      this.lastUserAddress = currentUserAddress;
      this.subscribeToUserIdeasSolutions(currentUserAddress);
    }

    layout.topBarContent.set(html`
      <create-idea-button></create-idea-button>
      <search-bar></search-bar>
    `);
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(true);
    layout.rightSidebarContent.set(html`
      <hot-ideas></hot-ideas>
      <popular-tags></popular-tags>
      <watched-tags></watched-tags>
    `);

    return html`
      <div class="container">
        <main>
          ${this.loading
            ? html` <tracked-changes .loading=${true}></tracked-changes>`
            : html`
                <tracked-changes
                  .ideaIds=${this.ideaIds}
                  .solutionIds=${this.solutionIds}
                ></tracked-changes>
              `}
          <beginner-tasks></beginner-tasks>
        </main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
