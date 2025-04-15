import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { consume } from '@lit/context';

import '@components/common/section-heading';
import '@components/idea/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { connectionContext } from '@state/common/context';
import { Connection } from '@/types/user/current-user';

import urqlClient from '@utils/urql-client';
import { IdeasByFunderDocument, type IdeasByFunderQuery } from '@gql';

@customElement('my-ideas')
export class MyIdeas extends LitElement {
  @consume({ context: connectionContext, subscribe: true })
  connection?: Connection;

  @state() private ideasQueryResult?: IdeasByFunderQuery;
  private unsubIdeas?: () => void;

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

    .loading {
      padding: 1rem;
      color: var(--sl-color-neutral-500);
    }
  `;

  private subscribe() {
    // Clean up previous subscription if it exists
    this.unsubIdeas?.();

    if (!this.connection?.address) return;

    const ideasSub = urqlClient
      .query(IdeasByFunderDocument, {
        funder: this.connection.address,
      })
      .subscribe((result) => {
        this.ideasQueryResult = result.data;
      });
    this.unsubIdeas = ideasSub.unsubscribe;
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.unsubIdeas?.();
    } else {
      this.subscribe();
    }
  };

  connectedCallback() {
    super.connectedCallback();
    if (this.connection?.address) {
      this.subscribe();
    }
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubIdeas?.();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
  }

  render() {
    return html`
      <section-heading>My Ideas</section-heading>
      <div class="content">
        ${this.ideasQueryResult === undefined
          ? html` <sl-spinner></sl-spinner>`
          : cache(
              this.ideasQueryResult.ideaContributions.map(
                (ic) => html`
                  <idea-card-small .idea=${ic.idea}></idea-card-small>
                `
              )
            )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'my-ideas': MyIdeas;
  }
}
