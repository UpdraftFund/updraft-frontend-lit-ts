import { customElement } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { SignalWatcher, html } from '@lit-labs/signals';

import '@shoelace-style/shoelace/dist/components/card/card';
import '@shoelace-style/shoelace/dist/components/button/button';
import {
  allTasksComplete,
  isComplete,
} from '@pages/home/state/beginner-tasks.ts';

@customElement('beginner-tasks')
export class BeginnerTasks extends SignalWatcher(LitElement) {
  static styles = css`
    section {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
      padding: 1rem 0;
    }

    sl-card {
      --padding: 1.25rem;
    }

    sl-card h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    sl-card p {
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    .button-upd-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  `;

  render() {
    if (allTasksComplete.get()) {
      return html``;
    } else {
      return html`
        <h2>Tasks</h2>
        <section>
          ${isComplete('follow-someone')
            ? html``
            : html`
                <sl-card>
                  <h3>Follow Someone</h3>
                  <p>
                    A great way to learn is by watching another user. You can
                    see a user's activity on their profile page. Go to Adam's
                    profile and follow him from there.
                  </p>
                  <sl-button variant="primary">Adam's profile</sl-button>
                </sl-card>
              `}
          ${isComplete('watch-tag')
            ? html``
            : html`
                <sl-card>
                  <h3>Watch a Tag</h3>
                  <p>
                    Stay up to date on the latest activity from a project, DAO,
                    investor, builder, or topic. Search for the [updraft] tag
                    and watch it.
                  </p>
                  <sl-button variant="primary">Search for [updraft]</sl-button>
                </sl-card>
              `}
          ${isComplete('connect-wallet')
            ? html``
            : html`
                <sl-card>
                  <h3>Connect a Wallet</h3>
                  <p>
                    Funding happens through an Ethereum wallet. Choose a wallet
                    provider, install it, then click "Connect Wallet"
                  </p>
                  <p>⬩Enkrypt ⬩Frame ⬩Metamask ⬩MEW ⬩Rabby</p>
                  <sl-button variant="primary">Connect Wallet</sl-button>
                </sl-card>
              `}
          ${isComplete('get-upd')
            ? html``
            : html`
                <sl-card>
                  <h3>Get UPD🪁</h3>
                  <p>
                    UPD is the Updraft token, and it's used in a lot of places.
                    You'll need at least 5 UPD to complete the rest of the
                    tasks. Swap some ETH for UPD.
                  </p>
                  <div class="button-upd-container">
                    <sl-button variant="primary">Swap for UPD</sl-button>
                    <div>🪁 525 UPD</div>
                  </div>
                </sl-card>
              `}
          ${isComplete('support-idea')
            ? html``
            : html`
                <sl-card>
                  <h3>Support an Idea</h3>
                  <p>
                    You can earn UPD by supporting a popular idea. The more you
                    deposit, the more you stand to earn. Find an Idea and
                    support it with UPD.
                  </p>
                  <sl-button variant="primary">Go to "Example" Idea</sl-button>
                </sl-card>
              `}
          ${isComplete('fund-solution')
            ? html``
            : html`
                <sl-card>
                  <h3>Fund a Solution</h3>
                  <p>
                    Every Idea needs a Solution. A great team and execution can
                    change the world. Fund a Solution you love and earn a reward
                    if others feel the same way.
                  </p>
                  <sl-button variant="primary"
                    >Go to "Example" Solution</sl-button
                  >
                </sl-card>
              `}
          ${isComplete('create-profile')
            ? html``
            : html`
                <sl-card>
                  <h3>Create a Profile</h3>
                  <p>
                    You're nearing the end of your beginner's journey. Soon
                    others will follow and learn from you. Create a profile so
                    they can see what you're up to and follow your lead.
                  </p>
                  <sl-button variant="primary">Go to Your Profile</sl-button>
                </sl-card>
              `}
        </section>
      `;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'beginner-tasks': BeginnerTasks;
  }
}
