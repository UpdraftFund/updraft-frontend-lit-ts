/***
 * This is the right-hand sidebar for the Home and Discover screens.
 * https://www.figma.com/design/lfPeBM41v53XQZLkYRUt5h/Updraft?node-id=920-7089&m=dev
 ***/

import { customElement, state, property, query, queryAll } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { consume } from "@lit/context";
import { SignalWatcher } from "@lit-labs/signals";

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@components/idea-card-small';

import fire from '@icons/fire.svg';
import xCircle from '@icons/x-circle.svg';
import pencilSquare from '@icons/pencil-square.svg';

import { updraftSettings, watchedTags, unwatchTag } from "@/context.ts";
import { UpdraftSettings } from "@/types";

import urqlClient from "@/urql-client.ts";
import { TopTagsDocument, IdeasBySharesDocument } from "@gql";
import { Idea, TagCount } from "@/types";

@customElement('right-side-bar')
export class RightSideBar extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      width: 100%;
      height: 100%;
      color: var(--main-foreground);
      background-color: var(--subtle-background);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section {
      background-color: var(--main-background);
      padding: 1rem;
      border-radius: 20px;
    }

    h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 500;
    }

    idea-card-small {
      width: 100%;
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 1rem 0;
    }

    .watched-tags {
      position: relative;
    }

    .tag {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background-color: var(--subtle-background);
      border-radius: 1rem;
      font-size: 0.875rem;
      text-decoration: none;
      color: var(--main-foreground);
    }

    .tag:hover {
      background-color: var(--accent);
      color: white;
    }

    .edit-button {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      --sl-font-size-medium: 1rem;
      color: var(--main-foreground);
    }

    .tag-with-remove {
      position: relative;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .remove-button {
      --sl-font-size-medium: 0.875rem;
      color: red;
      padding: 0;
    }

    .remove-button::part(base):hover {
      color: deeppink;
    }

    .wiggle {
      animation: wiggle 0.3s ease-in-out;
    }

    @keyframes wiggle {
      0%, 100% {
        transform: rotate(0deg);
      }
      25% {
        transform: rotate(-5deg);
      }
      75% {
        transform: rotate(5deg);
      }
    }

    .edit-mode .tag {
      padding-right: 0.5rem;
    }
  `

  @property({ type: Boolean, reflect: true, attribute: 'show-hot-ideas' }) showHotIdeas = false;

  @consume({ context: updraftSettings, subscribe: true }) updraftSettings!: UpdraftSettings;

  @state() private hotIdeas?: Idea[];
  @state() private topTags?: TagCount[];
  @state() private isEditMode = false;

  @queryAll('.watched-tags .tag') watchedTags!: NodeListOf<HTMLElement>;
  @query('.watched-tags') watchedTagsSection!: HTMLElement;

  private unsubHotIdeas?: () => void;
  private unsubTopTags?: () => void;

  private subscribe() {
    this.unsubHotIdeas?.();
    this.unsubTopTags?.();

    if (this.showHotIdeas) {
      const hotIdeasSub = urqlClient.query(IdeasBySharesDocument, {}).subscribe(result => {
        this.hotIdeas = result.data?.ideas as Idea[];
      });
      this.unsubHotIdeas = hotIdeasSub.unsubscribe;
    }

    const topTagsSub = urqlClient.query(TopTagsDocument, {}).subscribe(result => {
      this.topTags = result.data?.tagCounts as TagCount[];
    });
    this.unsubTopTags = topTagsSub.unsubscribe;
  }

  private handleFocusOut = (e: FocusEvent) => {
    if (!this.watchedTagsSection.contains(e.relatedTarget as Node)) {
      this.isEditMode = false;
    }
  };

  private handleGearClick() {
    this.isEditMode = !this.isEditMode;
    if (this.isEditMode) {
      this.watchedTags.forEach(tag => {
        tag.classList.add('wiggle');
        setTimeout(() => tag.classList.remove('wiggle'), 300);
      });
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.unsubHotIdeas?.();
      this.unsubTopTags?.();
    } else {
      this.subscribe();
    }
  };

  connectedCallback() {
    super.connectedCallback();
    this.subscribe();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubHotIdeas?.();
    this.unsubTopTags?.();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  render() {
    return html`
      ${this.showHotIdeas ? html`
        <div class="section">
          <h2>Hot Ideas
            <sl-icon src=${fire}></sl-icon>
          </h2>
          ${this.hotIdeas?.map(idea => html`
            <idea-card-small .idea=${idea}></idea-card-small>
          `)}
        </div>
      ` : ''}
      <div class="section">
        <h2>Top Tags</h2>
        <div class="tags-container">
          ${this.topTags?.map(tag => html`
            <a href="/discover?search=[${tag.id}]" class="tag">${tag.id}</a>
          `)}
        </div>
      </div>
      <div
          class="section watched-tags ${this.isEditMode ? 'edit-mode' : ''}"
          @focusout=${this.handleFocusOut}
          tabindex="-1"
      >
        <h2>Watched Tags</h2>
        <sl-icon-button
            class="edit-button"
            src=${pencilSquare}
            label="Edit watched tags"
            @click=${this.handleGearClick}
        ></sl-icon-button>
        <div class="tags-container">
          ${watchedTags.get()?.map(tag => html`
            <div class="tag-with-remove">
              <a href="/discover?search=[${tag}]" class="tag">
                ${tag}
                ${this.isEditMode ? html`
                  <sl-icon-button
                      class="remove-button"
                      src=${xCircle}
                      label="Remove ${tag} tag"
                      @click=${(e: Event) => {
                        e.preventDefault();
                        unwatchTag(tag);
                      }}
                  >
                  </sl-icon-button>
                ` : ''}
              </a>
            </div>
          `)}
        </div>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'right-side-bar': RightSideBar;
  }
}