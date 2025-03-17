/***
 * This component displays the watched tags section in the right sidebar.
 * It allows users to view and edit their watched tags.
 ***/

import { LitElement, html, css } from 'lit';
import {
  customElement,
  state,
  queryAll,
  query,
} from 'lit/decorators.js';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/icon-button/icon-button.js';

import { watchedTags, unwatchTag } from '@/context';

import pencilSquare from '@icons/pencil-square.svg';
import xCircle from '@icons/x-circle.svg';

@customElement('watched-tags')
export class WatchedTags extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .section {
      position: relative;
    }

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
  `;

  @state() private editMode = false;

  @queryAll('.tag') watchedTagsElements!: NodeListOf<HTMLElement>;
  @query('.section') watchedTagsSection!: HTMLElement;

  constructor() {
    super();
  }

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
      if (!this.watchedTagsSection.contains(e.target as Node)) {
        this.editMode = false;
      }
    }
  };

  private handleEditClick() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.watchedTagsElements.forEach((tag) => {
        tag.classList.add('wiggle');
        setTimeout(() => tag.classList.remove('wiggle'), 300);
      });
    }
  }

  render() {
    const tags = watchedTags.get();

    return html`
      <div class="section">
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
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'watched-tags': WatchedTags;
  }
}
