import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

@customElement('beginner-tasks')
export class BeginnerTasks extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--main-font);
    }

    .beginner-tasks {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
      padding: 1rem 0;
    }

    sl-card {
      --padding: 1.25rem;
    }

    .task-card-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .task-card-description {
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }
  `;

  render() {
    return html`
      <h2>Tasks</h2>
      <section class="beginner-tasks">
        <sl-card>
          <h3 class="task-card-title">Follow Someone</h3>
          <p class="task-card-description">
            A great way to learn is by watching another user. You can see a
            user’s activity on their profile page. Go to Adam’s profile and
            follow him from there.
          </p>
          <sl-button variant="primary">Adam's profile</sl-button>
        </sl-card>

        <sl-card>
          <h3 class="task-card-title">Watch a Tag</h3>
          <p class="task-card-description">
            Stay up to date on the latest activity from a project, DAO,
            investor, builder, or topic. Search for the [updraft] tag and watch
            it.
          </p>
          <sl-button variant="primary">Search for [updraft]</sl-button>
        </sl-card>

        <sl-card>
          <h3 class="task-card-title">Connect a Wallet</h3>
          <p class="task-card-description">
            Funding happens through an Ethereum wallet. Choose a wallet
            provider, install it, then click "Connect Wallet"
          </p>
          <p class="task-card-description">
            ⬩Enkrypt ⬩Frame ⬩Metamask ⬩MEW ⬩Rabby
          </p>
          <sl-button variant="primary">Connect Wallet</sl-button>
        </sl-card>

        <sl-card>
          <h3 class="task-card-title">Get UPD🪁</h3>
          <p class="task-card-description">
            You need the right balance of ETH, UPD, and other tokens to use
            Updraft. You'll need at least 5 UPD to complete the other tasks.
            Swap some ETH for UPD.
          </p>
          <sl-button variant="primary">Swap for UPD</sl-button>
          <div>🪁 525 UPD</div>
        </sl-card>

        <sl-card>
          <h3 class="task-card-title">Fund an Idea</h3>
          <p class="task-card-description">
            You can earn UPD by funding a popular idea. Look for the 💰 symbol
            to see the reward you can earn from future funders. Find an Idea and
            fund it with UPD.
          </p>
          <sl-button variant="primary">Go to "Example" Idea</sl-button>
        </sl-card>

        <sl-card>
          <h3 class="task-card-title">Fund a Solution</h3>
          <p class="task-card-description">
            Every Idea needs a Solution. A great team and execution can change
            the world. Fund a Solution you love and earn a reward 💰 if others
            feel the same way.
          </p>
          <sl-button variant="primary">Go to "Example" Solution</sl-button>
        </sl-card>

        <sl-card>
          <h3 class="task-card-title">Create a Profile</h3>
          <p class="task-card-description">
            You're nearing the end of your beginner's journey. Soon others will
            follow and learn from you. Create a profile so they can see what
            you're up to and follow your lead.
          </p>
          <sl-button variant="primary">Go to Your Profile</sl-button>
        </sl-card>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'beginner-tasks': BeginnerTasks;
  }
}
