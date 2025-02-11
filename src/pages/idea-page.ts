import { customElement, property } from 'lit/decorators.js';
import { html, css, LitElement } from 'lit';
import { IdeaDocument } from '@gql';
import urqlClient from '@/urql-client';
import '@layout/top-bar'
import { Task } from '@lit/task';

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

    activity-feed {
      flex: 0 0 789px;
    }

    main {
      flex: 1;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1rem 2rem;
      color: var(--main-foreground);
      max-width: 554px;
    }
  `;

  @property() ideaId!: string;

  //TODO: each Idea URL should include a network
  //@property() network: string;

  private readonly idea = new Task(this, {
    task: async ([ideaId]) => {
        const result = await urqlClient.query(IdeaDocument, { ideaId });
        return result.data?.idea;
    },
    args: () => [this.ideaId] as const
  });

  render() {
    return html`
      <top-bar></top-bar>
      ${this.idea.render({
        complete: (value) => {
          return JSON.stringify(value, null, 2);
        }
      })}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'idea-page': IdeaPage;
  }
}
