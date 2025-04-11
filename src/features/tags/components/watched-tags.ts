/***
 * This component displays the watched tags section in the right sidebar.
 * It allows users to view and edit their watched tags.
 ***/

import { LitElement, css } from 'lit';
import { SignalWatcher, html } from '@lit-labs/signals';
import { customElement, state, queryAll, query } from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

import { watchedTags, unwatchTag } from '@/features/user/state/watched-tags';

import pencilSquare from '@icons/user/pencil-square.svg';
import xCircle from '@icons/common/x-circle.svg';

@customElement('watched-tags')
export class WatchedTags extends SignalWatcher(LitElement) {
  static styles = css`
    h2 {
      font-size: 1.2rem;
      margin: 0 0 1rem 0;
      color: var(--section-heading);
    }

    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 1rem 0;
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
      color: var(--main-background);
    }

    .edit-button {
      --sl-font-size-medium: 1rem;
      color: var(--main-foreground);
    }

    .tag-with-remove:hover .remove-button,
    .tag-with-remove .remove-button::part(base):hover {
      color: var(--main-background);
    }

    .remove-button {
      color: var(--sl-color-danger-800);
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
      display: flex;
      font-size: 0.875rem;
      padding-right: 0rem;
      align-items: center;
    }

    .no-tags-message {
      text-align: center;
      color: var(--subtle-text);
      font-style: italic;
      font-size: 0.9rem;
    }
  `;

  @state() private editMode = false;

  @queryAll('.tag') tags!: NodeListOf<HTMLElement>;
  @query('.tags-container') tagsContainer!: HTMLElement;

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('click', this.handleClickOutsideEditArea);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleClickOutsideEditArea);
  }

  private handleClickOutsideEditArea = (e: MouseEvent) => {
    if (this.editMode) {
      if (!this.tagsContainer.contains(e.target as Node)) {
        this.editMode = false;
      }
    }
  };

  private handleEditClick() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.tags.forEach((tag) => {
        tag.classList.add('wiggle');
        setTimeout(() => tag.classList.remove('wiggle'), 300);
      });
    }
  }

  render() {
    const tags = watchedTags.get();

    return html`
      <section @click=${(e: Event) => e.stopPropagation()}>
        <h2>
          Watched Tags
          ${tags.size > 0
            ? html` <sl-icon-button
                class="edit-button"
                src=${pencilSquare}
                label="Edit watched tags"
                @click=${this.handleEditClick}
              ></sl-icon-button>`
            : html``}
        </h2>
        <div class="tags-container ${this.editMode ? 'edit-mode' : ''}">
          ${tags.size > 0
            ? html` ${[...tags].map(
                (tag) => html`
                  <div class="tag-with-remove">
                    <a class="tag" href="/discover?search=[${tag}]"
                      >${tag}
                      ${this.editMode
                        ? html`
                            <sl-icon-button
                              class="remove-button"
                              src=${xCircle}
                              label="Remove watched tag"
                              @click=${(e: Event) => {
                                e.preventDefault();
                                unwatchTag(tag);
                              }}
                            ></sl-icon-button>
                          `
                        : html``}
                    </a>
                  </div>
                `
              )}`
            : html`<p class="no-tags-message">No watched tags</p>`}
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'watched-tags': WatchedTags;
  }
}
