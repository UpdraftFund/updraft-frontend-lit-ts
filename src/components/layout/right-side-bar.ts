/***
 * This is the right-hand sidebar for the Home and Discover screens.
 * https://www.figma.com/design/lfPeBM41v53XQZLkYRUt5h/Updraft?node-id=920-7089&m=dev
 ***/

import { LitElement, html, css } from 'lit';
import {
  customElement,
  property,
  state,
  queryAll,
  query,
} from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';
import '@/components/shared/idea-card-small';
import '@/components/page-specific/idea/related-ideas';
import '@/components/page-specific/idea/top-supporters';
import '@/components/shared/hot-ideas';

import urqlClient from '@/urql-client';
import { TopTagsDocument } from '@gql';
import { TagCount } from '@/types';
import { watchedTags, unwatchTag } from '@/context';

import pencilSquare from '@icons/pencil-square.svg';
import xCircle from '@icons/x-circle.svg';

// Import idea page specific components

@customElement('right-side-bar')
export class RightSideBar extends LitElement {
  static styles = css`
    :host {
      display: block;
      background-color: var(--main-background);
      border-left: 1px solid var(--border-default);
      padding: 1rem;
      overflow-y: auto;
    }

    .sidebar-content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    h2 {
      font-size: 1.2rem;
      margin: 0 0 1rem 0;
      color: var(--section-heading);
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
      color: var(--sl-color-neutral-0);
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

    .tag-with-remove:hover .remove-button,
    .tag-with-remove .remove-button::part(base):hover {
      color: var(--sl-color-neutral-0);
    }

    .remove-button {
      --sl-font-size-medium: 0.875rem;
      color: var(--sl-color-danger-900);
      padding: 0;
    }

    .wiggle {
      animation: wiggle 0.3s ease-in-out;
    }

    @keyframes wiggle {
      0%,
      100% {
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

    /* Responsive behavior */
    @media (max-width: 1024px) and (min-width: 769px) {
      :host {
        transition:
          opacity 0.3s ease,
          visibility 0.3s ease;
      }

      :host([hidden-by-left-sidebar]) {
        opacity: 0;
        visibility: hidden;
        width: 0;
        padding: 0;
        margin: 0;
        flex-basis: 0 !important;
        overflow: hidden;
      }
    }

    @media (max-width: 768px) {
      :host {
        border-left: none;
        border-top: 1px solid var(--border-default);
      }
    }

    .hot-ideas h2 {
      color: var(--attention);
    }
  `;

  @property({ type: Boolean, reflect: true, attribute: 'show-hot-ideas' })
  showHotIdeas = false;

  @property({
    type: Boolean,
    reflect: true,
    attribute: 'hidden-by-left-sidebar',
  })
  hiddenByLeftSidebar = false;

  @property() ideaId?: string;

  @state() private topTags?: TagCount[];
  @state() private editMode = false;

  @queryAll('.watched-tags .tag') watchedTags!: NodeListOf<HTMLElement>;
  @query('.watched-tags') watchedTagsSection!: HTMLElement;

  private unsubTopTags?: () => void;

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    this.subscribe();
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    document.addEventListener('click', this.handleClickOutsideEditArea);
    document.addEventListener(
      'expanded',
      this.handleLeftSidebarExpanded as EventListener
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubTopTags?.();
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
    document.removeEventListener('click', this.handleClickOutsideEditArea);
    document.removeEventListener(
      'expanded',
      this.handleLeftSidebarExpanded as EventListener
    );
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);

    // Re-subscribe when showHotIdeas changes
    if (changedProperties.has('showHotIdeas')) {
      this.subscribe();
    }
  }

  private subscribe() {
    this.unsubTopTags?.();

    const topTagsSub = urqlClient
      .query(TopTagsDocument, {})
      .subscribe((result) => {
        this.topTags = result.data?.tagCounts as TagCount[];
      });
    this.unsubTopTags = topTagsSub.unsubscribe;
  }

  private handleClickOutsideEditArea = (e: MouseEvent) => {
    if (this.editMode) {
      if (!this.watchedTagsSection.contains(e.target as Node)) {
        this.editMode = false;
      }
    }
  };

  private handleEditClick() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.watchedTags.forEach((tag) => {
        tag.classList.add('wiggle');
        setTimeout(() => tag.classList.remove('wiggle'), 300);
      });
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      this.unsubTopTags?.();
    } else {
      this.subscribe();
    }
  };

  private handleLeftSidebarExpanded = (e: Event) => {
    // Only respond to this event in tablet view
    if (window.innerWidth <= 1024 && window.innerWidth > 768) {
      // The event detail is now just the boolean value
      this.hiddenByLeftSidebar = (e as CustomEvent<boolean>).detail;
    }
  };

  render() {
    const tags = watchedTags.get();

    return html`
      <div class="sidebar-content">
        ${this.showHotIdeas ? html`<hot-ideas></hot-ideas>` : ''}
        ${this.ideaId
          ? html`
              <top-supporters .ideaId=${this.ideaId}></top-supporters>
              <related-ideas .ideaId=${this.ideaId}></related-ideas>
            `
          : html`
              <div class="section watched-tags">
                <h2>Watched Tags</h2>
                <sl-icon-button
                  class="edit-button"
                  name="pencil-square"
                  src=${pencilSquare}
                  label="Edit watched tags"
                  @click=${this.handleEditClick}
                ></sl-icon-button>
                <div class="tags-container ${this.editMode ? 'edit-mode' : ''}">
                  ${tags.length
                    ? tags.map(
                        (tag) => html`
                          <div class="tag-with-remove">
                            <a
                              class="tag"
                              href="/discover?tab=search&search=[${tag}]"
                              >${tag}</a
                            >
                            ${this.editMode
                              ? html`
                                  <sl-icon-button
                                    class="remove-button"
                                    src=${xCircle}
                                    label="Remove tag"
                                    @click=${() => unwatchTag(tag)}
                                  ></sl-icon-button>
                                `
                              : ''}
                          </div>
                        `
                      )
                    : html`<div>No watched tags yet</div>`}
                </div>
              </div>

              ${this.topTags
                ? html`
                    <div class="section">
                      <h2>Popular Tags</h2>
                      <div class="tags-container">
                        ${this.topTags.map(
                          (tag) => html`
                            <a
                              class="tag"
                              href="/discover?tab=search&search=[${tag.id}]"
                            >
                              ${tag.id}
                            </a>
                          `
                        )}
                      </div>
                    </div>
                  `
                : ''}
            `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'right-side-bar': RightSideBar;
  }
}
