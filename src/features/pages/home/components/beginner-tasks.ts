import { customElement, query } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { SignalWatcher, html } from '@lit-labs/signals';

// Images
import followUser from '@images/home/follow-user.png';
import watchTag from '@images/home/watch-tag.png';
import connectWallet from '@images/home/connect-wallet.png';
import getUpd from '@images/home/get-upd.png';
import supportIdea from '@images/home/support-idea.png';
import fundSolution from '@images/home/fund-solution.png';
import createProfile from '@images/home/create-profile.png';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/card/card';
import '@shoelace-style/shoelace/dist/components/button/button';

// Components
import '@components/common/upd-dialog';
import { UpdDialog } from '@components/common/upd-dialog';

// State
import { allTasksComplete, isComplete } from '@state/user/beginner-tasks.ts';

// Utils
import { modal } from '@utils/web3.ts';

@customElement('beginner-tasks')
export class BeginnerTasks extends SignalWatcher(LitElement) {
  static styles = css`
    h2 {
      margin: 1.5rem 0 1rem;
    }
    section {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
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
    }
    sl-card::part(base),
    sl-card::part(body) {
      height: 100%;
    }
    sl-card img {
      float: right;
      width: 125px;
      height: auto;
      margin: 0 0 8px 16px;
    }
    /* Clear float before footer */
    .clear-float {
      clear: both;
    }
  `;

  @query('upd-dialog', true) updDialog!: UpdDialog;

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
                  <img
                    src=${followUser}
                    alt="Follow user illustration"
                  />
                  <h3>Follow Someone</h3>
                  <p>
                    A great way to learn is by watching another user. You can
                    see a user's activity on their profile page.
                  <p> Go to
                    <a
                      href="/profile/0xdC0046B52e2E38AEe2271B6171ebb65cCD337518"
                    >Adam's profile</a
                    >
                    and follow him.
                  </p>
                  </p>
                  <div class="clear-float"></div>
                  <sl-button
                    slot="footer"
                    variant="primary"
                    href="/profile/0xdC0046B52e2E38AEe2271B6171ebb65cCD337518"
                  >Adam's profile
                  </sl-button>
                </sl-card>
              `}
          ${isComplete('watch-tag')
            ? html``
            : html`
              <sl-card>
                <img
                  src=${watchTag}
                  alt="Watch tag illustration"
                />
                <h3>Watch a Tag</h3>
                <p>
                  Stay up to date on the latest activity from a project, DAO,
                  investor, builder, or topic.
                <p>
                    <a href="/discover?search=[updraft]"
                    >Search for the updraft tag</a> and watch it.
                  </p>
                </p>
                <div class="clear-float"></div>
                <sl-button
                  slot="footer"
                  variant="primary"
                  href="/discover?search=[updraft]"
                >Search for [updraft]
                </sl-button
                >
              </sl-card>
            `}
          ${isComplete('connect-wallet')
            ? html``
            : html`
                <sl-card>
                  <img src=${connectWallet} alt="Connect wallet illustration" />
                  <h3>Connect a Wallet</h3>
                  <p>
                    A wallet identifies you to others, stores your funds, and
                    allows you to take actions in Updraft. You can install a
                    wallet from these links.
                  </p>
                  <p>
                    ⬩<a href="https://enkrypt.com" target="_blank">Enkrypt</a>
                    ⬩<a href="https://frame.sh" target="_blank">Frame</a> ⬩<a
                      href="https://metamask.io/download"
                      target="_blank"
                      >Metamask</a
                    >
                    ⬩<a href="https://rabby.io/" target="_blank">Rabby</a>
                  </p>
                  <div class="clear-float"></div>
                  <sl-button
                    slot="footer"
                    variant="primary"
                    @click=${() => {
                      modal.open({ view: 'Connect' });
                    }}
                    >Connect Wallet
                  </sl-button>
                </sl-card>
              `}
          ${isComplete('get-upd')
            ? html``
            : html`
                <sl-card>
                  <img
                    src=${getUpd}
                    alt="Get UPD illustration"
                  />
                  <h3>Get UPD🪁</h3>
                  <p>
                    UPD is the Updraft token, and it's used in a lot of places.
                  <p>
                    You'll need at least 5 UPD to complete the rest of the tasks.
                  </p>
                  </p>
                  <div class="clear-float"></div>
                  <sl-button
                    slot="footer"
                    variant="primary"
                    @click=${() => this.updDialog.show()}
                  >Get UPD
                  </sl-button>
                  <upd-dialog></upd-dialog>
                </sl-card>
              `}
          ${isComplete('support-idea')
            ? html``
            : html`
                <sl-card>
                  <img src=${supportIdea} alt="Support idea illustration" />
                  <h3>Support an Idea</h3>
                  <p>
                    You can earn UPD by supporting a popular Idea. The more you
                    deposit, the more you stand to earn. Find an Idea and
                    support it with UPD.
                  </p>
                  <div class="clear-float"></div>
                  <sl-button
                    slot="footer"
                    variant="primary"
                    href="/idea/0xaff2df5502bf27b4338403c37415b643048d1c68"
                    >"Build Updraft" Idea
                  </sl-button>
                </sl-card>
              `}
          ${isComplete('fund-solution')
            ? html``
            : html`
                <sl-card>
                  <img src=${fundSolution} alt="Fund solution illustration" />
                  <h3>Fund a Solution</h3>
                  <p>
                    Every Idea needs a Solution. A great team and execution can
                    change the world. Fund a Solution you love and earn a reward
                    if others feel the same way.
                  </p>
                  <div class="clear-float"></div>
                  <sl-button
                    slot="footer"
                    variant="primary"
                    href="/solution/0xdb07e23c068b672079eb3977f1e5dc4c1ae214d8"
                    >"Build Updraft" Solution
                  </sl-button>
                </sl-card>
              `}
          ${isComplete('create-profile')
            ? html``
            : html`
                <sl-card>
                  <img src=${createProfile} alt="Create profile illustration" />
                  <h3>Create a Profile</h3>
                  <p>
                    You're nearing the end of your beginner's journey. Soon
                    others will follow and learn from you. Create a profile so
                    they can see what you're up to and follow your lead.
                  </p>
                  <div class="clear-float"></div>
                  <sl-button
                    slot="footer"
                    variant="primary"
                    href="/edit-profile"
                    >Go to Your Profile
                  </sl-button>
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
