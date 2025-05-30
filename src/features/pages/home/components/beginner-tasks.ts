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
//import aura from '@images/home/aura-logo.png';
import sad from '@images/home/song-a-day-logo.png';
import updraft from '@images/home/updraft-logo.png';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/card/card';
import '@shoelace-style/shoelace/dist/components/button/button';

// Components
import '@components/common/upd-dialog';
import { UpdDialog } from '@components/common/upd-dialog';

// State
import { isComplete } from '@state/user/beginner-tasks.ts';

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
      margin-bottom: 1.25rem;
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
    .clear-float {
      clear: both;
    }
    sl-card.campaign {
      position: relative;
      --border-radius: 6px 12px 6px 6px;
    }
    sl-card.campaign::part(base) {
      background: linear-gradient(
        135deg,
        var(--sl-color-neutral-0) 0%,
        var(--sl-color-primary-50) 100%
      );
      border: 2px solid var(--border-accent);
    }
    sl-card.campaign::before {
      content: '🚀 Campaign';
      position: absolute;
      top: 0px;
      right: 0px;
      background: var(--badge);
      color: var(--badge-text);
      padding: 0.25rem 0.75rem;
      border-radius: 0 10px;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      z-index: 1;
    }
    sl-card.campaign h3 {
      color: var(--accent);
      font-weight: 700;
    }
    sl-card.campaign > h4 {
      font-size: 1rem;
      font-weight: 600;
      margin: 1rem 0 0.5rem 0;
      color: var(--subtle-text);
      border-bottom: 2px solid var(--border-accent);
      padding: 0.25rem;
      max-width: 50%;
    }
    sl-card.campaign .committed-list {
      margin: 0.5rem 0 1rem 0;
      padding-left: 1.25rem;
    }
    .committed-list li {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--main-foreground);
      margin-bottom: 0.25rem;
    }
    .tags {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.25rem;
      padding: 0;
      list-style: none;
      margin: 0;
    }
    .tags h4 {
      font-size: 0.85rem;
      margin: 0 0.25rem 0 0;
      padding: 0.25rem 0 0;
    }
    .tags li {
      background: var(--subtle-background);
      color: var(--main-foreground);
      padding: 0.25rem 0.5rem;
      margin-top: 0.25rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 500;
    }
  `;

  @query('upd-dialog', true) updDialog!: UpdDialog;

  render() {
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
                      href="/profile/0xab9cbeef799b2fef5dd1acbbc82c631fbc0b0d2d"
                    >Adam's profile</a
                    >
                    and follow him.
                  </p>
                  </p>
                  <div class="clear-float"></div>
                  <sl-button
                    slot="footer"
                    variant="primary"
                    href="/profile/0xab9cbeef799b2fef5dd1acbbc82c631fbc0b0d2d"
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
                  ⬩<a href="https://enkrypt.com" target="_blank">Enkrypt</a> ⬩<a
                    href="https://frame.sh"
                    target="_blank"
                    >Frame</a
                  >
                  ⬩<a href="https://metamask.io/download" target="_blank"
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
                  deposit, the more you stand to earn. Find an Idea and support
                  it with UPD.
                </p>
                <div class="clear-float"></div>
                <sl-button
                  slot="footer"
                  variant="primary"
                  href="/idea/0x4a7e2b823d31b094e87303a1b239a4b9e139abf2"
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
                  href="/solution/0x6863d6905de27fa150cc08633c823e1299aa5cc4"
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
                  You're nearing the end of your beginner's journey. Soon others
                  will follow and learn from you. Create a profile so they can
                  see what you're up to and follow your lead.
                </p>
                <div class="clear-float"></div>
                <sl-button slot="footer" variant="primary" href="/edit-profile"
                  >Go to Your Profile
                </sl-button>
              </sl-card>
            `}
        <!--  <sl-card class="campaign">
          <img src=${updraft} alt="Aura logo" />
          <h3>Aura Use Cases</h3>
          <p>
            Find realistic use cases for
            <a href="https://brightid.gitbook.io/aura" target="_blank">Aura</a>.
          </p>
          <h4>Committed</h4>
          <ul class="committed-list">
            <li>100M UPD for Ideas</li>
            <li>200M UPD for Solutions</li>
          </ul>
          <span class="tags">Tags: [aura] [use-cases]</span>
          <div class="clear-float"></div>
          <sl-button
            slot="footer"
            variant="primary"
            href="/discover?search=[aura] [use-cases]"
            >View Ideas
          </sl-button>
        </sl-card> -->
        <sl-card class="campaign">
          <img src=${updraft} alt="Updraft logo" />
          <h3>Updraft Networks</h3>
          <p>
            Vote to decide which networks will have UPD liquidity pools and
            Updraft app support.
            <a href="https://guide.updraft.fund/updraft/voting/networks"
              >Read rules.</a
            >
          </p>
          <div class="clear-float"></div>
          <ul class="tags">
            <h4>Tags:</h4>
            <li>updraft</li>
            <li>vote</li>
            <li>networks</li>
          </ul>
          <sl-button
            slot="footer"
            variant="primary"
            href="/discover?search=[updraft] [vote] [networks]"
            >View Ideas
          </sl-button>
        </sl-card>
        <sl-card class="campaign">
          <img src=${updraft} alt="Updraft logo" />
          <h3>Updraft Stablecoins</h3>
          <p>
            Vote to decide which stablecoins will appear on Updraft and in
            liquidity pools.
            <a href="https://guide.updraft.fund/updraft/voting/stablecoins"
              >Read rules.</a
            >
          </p>
          <div class="clear-float"></div>
          <ul class="tags">
            <h4>Tags:</h4>
            <li>updraft</li>
            <li>vote</li>
            <li>stablecoins</li>
          </ul>
          <sl-button
            slot="footer"
            variant="primary"
            href="/discover?search=[updraft] [vote] [stablecoins]"
            >View Ideas
          </sl-button>
        </sl-card>
        <sl-card class="campaign">
          <img src=${sad} alt="SongDust logo" />
          <h3>SongDust Week 1</h3>
          <p>
            Use the
            <a href="https://gallery.songaday.world/" target="_blank"
              >Song-A-Day gallery</a
            >
            to find fitting songs and post them to Updraft with this week's
            tags. The song with the most 🔥 wins!
          </p>
          <div class="clear-float"></div>
          <ul class="tags">
            <h4>Tags:</h4>
            <li>songdust</li>
            <li>family</li>
            <li>insanity</li>
          </ul>
          <sl-button
            slot="footer"
            variant="primary"
            href="/discover?search=[songdust] [family] [insanity]"
            >Songs with these tags
          </sl-button>
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
