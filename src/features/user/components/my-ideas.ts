import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { cache } from 'lit/directives/cache.js';
import { SignalWatcher } from '@lit-labs/signals';

import '@components/common/section-heading';
import '@components/idea/idea-card-small';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

import { userAddress } from '@state/user';

import urqlClient from '@utils/urql-client';
import { IdeasByFunderDocument, IdeasByFunderQuery } from '@gql';

@customElement('my-ideas')
export class MyIdeas extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
    }

    .content {
      padding: 1rem 0 0;
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

  @state() private ideasQueryResult?: IdeasByFunderQuery;

  // Track the current user address to detect changes
  private lastUserAddress: string | null = null;

  private unsubIdeas?: () => void;

  private subscribe(address: `0x${string}`) {
    // Clean up previous subscription if it exists
    this.unsubIdeas?.();

    const ideasSub = urqlClient
      .query(IdeasByFunderDocument, {
        funder: address,
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
      const currentAddress = userAddress.get();
      if (currentAddress) {
        this.subscribe(currentAddress);
      }
    }
  };

  connectedCallback() {
    super.connectedCallback();
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
    const currentUserAddress = userAddress.get();
    if (currentUserAddress && this.lastUserAddress !== currentUserAddress) {
      this.lastUserAddress = currentUserAddress;
      this.subscribe(currentUserAddress);
    }
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
