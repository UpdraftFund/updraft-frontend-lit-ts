import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

import '@layout/top-bar';
import '@layout/left-side-bar';
import '@layout/right-side-bar';
import '@components/search-bar';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

@customElement('home-page')
export class HomePage extends LitElement {
  static styles = css`
    search-bar {
      margin: 0 auto;
    }

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

    left-side-bar {
      flex: 0 0 300px;
    }

    main {
      flex: 1;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.5rem 1rem;
      color: var(--main-foreground);
      border-radius: 25px 25px 0 0;
      background: var(--main-background);
    }

    .tracked-changes {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .tracked-changes sl-card {
      --padding: 1rem;
    }

    .change-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.5rem;
    }

    .change-card-title {
      font-family: var(--sl-font-sans);
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
    }

    .change-card-byline {
      font-size: 0.875rem;
      color: var(--sl-color-neutral-600);
    }

    .change-card-supporters {
      font-size: 1rem;
      color: var(--sl-color-neutral-700);
    }

    .beginner-tasks {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
      padding: 1rem 0;
    }

    .beginner-tasks sl-card {
      --padding: 1.25rem;
    }

    .task-card-title {
      font-family: var(--sl-font-sans);
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .task-card-description {
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    right-side-bar {
      flex: 0 0 300px;
      border-radius: 0 0 0 25px;
      background: var(--subtle-background);
    }
  `;

  render() {
    return html`
      <top-bar><search-bar></search-bar></top-bar>
      <div class="container">
        <left-side-bar location="home"></left-side-bar>
        <main>
          <section class="tracked-changes">
            <h2>Tracked Changes</h2>
            <sl-card>
              <div class="change-card-header">
                <div>
                  <h3 class="change-card-title">
                    Audit the Updraft smart contracts
                  </h3>
                  <div class="change-card-byline">by johnnycake.eth</div>
                </div>
                <sl-icon-button name="x-lg" label="Remove"></sl-icon-button>
              </div>
              <div class="change-card-supporters">
                Supported by adamstallard.eth, bastin.eth, and 4 others
              </div>
            </sl-card>

            <sl-card>
              <div class="change-card-header">
                <div>
                  <h3 class="change-card-title">
                    Updraft Smart Contract Audit
                  </h3>
                  <div class="change-card-byline">by Acme Auditors</div>
                </div>
                <sl-icon-button name="x-lg" label="Remove"></sl-icon-button>
              </div>
              <div>Has a new Solution</div>
              <p>
                Our industry-leading audit methodology and tooling includes a
                review of your code's logic, with a mathematical approach to
                ensure your program works as intended.
              </p>
              <sl-button variant="primary">Fund this Solution</sl-button>
              <div class="change-details">
                <span>⏰ in 2 days</span>
                <span>🎯 Goal: 0% of 12.2k USDGLO</span>
                <span>💎 200K</span>
                <span>💰 10%</span>
              </div>
            </sl-card>
          </section>

          <h2>Tasks</h2>

          <section class="beginner-tasks">
            <sl-card>
              <h3 class="task-card-title">Follow Someone</h3>
              <p class="task-card-description">
                A great way to learn is by watching another user. You can see a
                user's activity on their profile page. Go to Adam's profile and
                follow him from there.
              </p>
              <sl-button variant="primary">Adam's profile</sl-button>
            </sl-card>

            <sl-card>
              <h3 class="task-card-title">Watch a Tag</h3>
              <p class="task-card-description">
                Stay up to date on the latest activity from a project, DAO,
                investor, builder, or topic. Search for the [updraft] tag and
                watch it.
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
                You can earn UPD by funding a popular idea. Look for the 💰
                symbol to see the reward you can earn from future funders. Find
                an Idea and fund it with UPD.
              </p>
              <sl-button variant="primary">Go to "Example" Idea</sl-button>
            </sl-card>

            <sl-card>
              <h3 class="task-card-title">Fund a Solution</h3>
              <p class="task-card-description">
                Every Idea needs a Solution. A great team and execution can
                change the world. Fund a Solution you love and earn a reward 💰
                if others feel the same way.
              </p>
              <sl-button variant="primary">Go to "Example" Solution</sl-button>
            </sl-card>

            <sl-card>
              <h3 class="task-card-title">Create a Profile</h3>
              <p class="task-card-description">
                You're nearing the end of your beginner's journey. Soon others
                will follow and learn from you. Create a profile so they can see
                what you're up to and follow your lead.
              </p>
              <sl-button variant="primary">Go to Your Profile</sl-button>
            </sl-card>
          </section>
        </main>
        <right-side-bar show-hot-ideas></right-side-bar>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
