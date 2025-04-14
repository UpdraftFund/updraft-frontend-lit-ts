import { customElement } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { Task } from '@lit/task';
import { consume } from '@lit/context';

import '@components/common/section-heading';
import '@components/idea/idea-card-small';

import { connectionContext } from '@state/common/context';
import { Connection } from '@/types/user/current-user';

import urqlClient from '@utils/urql-client';
import { IdeasByFunderDocument } from '@gql';

@customElement('my-ideas')
export class MyIdeas extends SignalWatcher(LitElement) {
  @consume({ context: connectionContext, subscribe: true })
  connection?: Connection;

  static styles = css`
    :host {
      display: block;
    }

    .content {
      padding: 1rem 1.4rem 0;
      box-sizing: border-box;
    }

    idea-card-small {
      width: 100%;
    }
  `;

  private ideasTask = new Task(this, {
    task: async ([funder]) => {
      if (funder) {
        const result = await urqlClient.query(IdeasByFunderDocument, {
          funder,
        });
        return result.data?.ideaContributions;
      }
    },
    args: () => [this.connection?.address],
  });

  render() {
    return html`
      <section-heading>My Ideas</section-heading>
      <div class="content">
        ${this.ideasTask.render({
          complete: (ics) =>
            ics?.map(
              (ic) => html`
                <idea-card-small .idea=${ic.idea}></idea-card-small>
              `
            ),
        })}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-ideas': MyIdeas;
  }
}
