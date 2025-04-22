import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { Task } from '@lit/task';

import '@shoelace-style/shoelace/dist/components/button/button.js';

import '@components/navigation/search-bar';
import '@components/navigation/create-idea-button';
import '@pages/home/components/tracked-changes';
import '@pages/home/components/beginner-tasks';

import urqlClient from '@utils/urql-client';

import { userAddress } from '@state/user';
import layout from '@state/layout';

interface UserIdeasSolutionsResponse {
  createdIdeas: Array<{ id: string; name: string }>;
  fundedIdeas: Array<{ idea: { id: string; name: string } }>;
  createdSolutions: Array<{ id: string }>;
  fundedSolutions: Array<{ solution: { id: string } }>;
}

/**
 * Home page component that displays tracked changes and beginner tasks.
 */
@customElement('home-page')
export class HomePage extends LitElement {
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

  private readonly userIdeasSolutions = new Task(this, {
    task: async () => {
      if (!userAddress) {
        console.log('No user address found');
        return { ideaIds: [], solutionIds: [] };
      }

      try {
        console.log('Fetching ideas and solutions for user:', userAddress);

        // Define the GraphQL query inline to avoid module import issues
        const USER_IDEAS_SOLUTIONS_QUERY = `
            query UserIdeasSolutions($userId: String!) {
              createdIdeas: ideas(
                where: { creator: $userId }
                orderBy: startTime
                orderDirection: desc
              ) {
                id
                name
              }
              
              fundedIdeas: ideaContributions(
                where: { funder: $userId }
                orderBy: createdTime
                orderDirection: desc
              ) {
                idea {
                  id
                  name
                }
              }
              
              createdSolutions: solutions(
                where: { drafter: $userId }
                orderBy: startTime
                orderDirection: desc
              ) {
                id
              }
              
              fundedSolutions: solutionContributions(
                where: { funder: $userId }
                orderBy: createdTime
                orderDirection: desc
              ) {
                solution {
                  id
                }
              }
            }
          `;

        const result = await urqlClient.query<UserIdeasSolutionsResponse>(
          USER_IDEAS_SOLUTIONS_QUERY,
          {
            userId: userAddress,
          }
        );

        if (result.error) {
          console.error(
            'Error fetching user ideas and solutions:',
            result.error
          );
          return { ideaIds: [], solutionIds: [] };
        }

        // Extract and combine idea IDs
        const createdIdeaIds =
          result.data?.createdIdeas?.map((idea) => idea.id) || [];
        const fundedIdeaIds =
          result.data?.fundedIdeas?.map(
            (contribution) => contribution.idea.id
          ) || [];
        const ideaIds = [...new Set([...createdIdeaIds, ...fundedIdeaIds])];

        // Extract and combine solution IDs
        const createdSolutionIds =
          result.data?.createdSolutions?.map((solution) => solution.id) || [];
        const fundedSolutionIds =
          result.data?.fundedSolutions?.map(
            (contribution) => contribution.solution.id
          ) || [];
        const solutionIds = [
          ...new Set([...createdSolutionIds, ...fundedSolutionIds]),
        ];

        console.log('User ideas:', ideaIds);
        console.log('User solutions:', solutionIds);

        return { ideaIds, solutionIds };
      } catch (error) {
        console.error('Error fetching user ideas and solutions:', error);
        return { ideaIds: [], solutionIds: [] };
      }
    },
    args: () => [userAddress],
  });

  render() {
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
          ${this.userIdeasSolutions.render({
            pending: () => html` <tracked-changes></tracked-changes>`,
            complete: ({ ideaIds, solutionIds }) => html`
              <tracked-changes
                .ideaIds=${ideaIds}
                .solutionIds=${solutionIds}
              ></tracked-changes>
            `,
            error: (error) => {
              console.error('Error rendering tracked changes:', error);
              return html` <tracked-changes></tracked-changes>`;
            },
          })}
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
