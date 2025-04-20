import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/avatar/avatar.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/tag/tag.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';

// TODO: Import actual data fetching logic and types
// import { fetchSolutionDetails } from '../services/solution-service';
// import { Solution } from '../types/solution-types';

@customElement('solution-header')
export class SolutionHeader extends LitElement {
  @property({ type: String })
  solutionId?: string;

  // TODO: Replace with actual fetched data
  @state() private _solutionTitle = 'Placeholder Solution Title';
  @state() private _ideaId = 'idea-placeholder-id';
  @state() private _ideaName = 'Original Idea Name';
  @state() private _creatorAddress = '0x1234...5678';
  @state() private _creatorName: string | null = 'Creator Name'; // Or null if no profile
  @state() private _creatorAvatar = ''; // Placeholder or default avatar URL
  @state() private _status = 'Funding'; // e.g., Funding, In Progress, Completed

  // TODO: Add logic for fetching data based on solutionId

  static styles = css`
    .header-container {
      display: flex;
      flex-direction: column;
      gap: var(--sl-spacing-medium);
      margin-bottom: var(--sl-spacing-large);
      padding: var(--sl-spacing-large);
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: var(--sl-radius-medium);
      background-color: var(--sl-color-neutral-50);
    }
    .top-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start; /* Align items to the start of the cross axis */
      gap: var(--sl-spacing-medium);
    }
    .title-area h1 {
      margin: 0 0 var(--sl-spacing-2x-small) 0;
      font-size: var(--sl-font-size-2x-large);
      line-height: var(--sl-line-height-dense);
    }
    .idea-link {
      font-size: var(--sl-font-size-small);
      color: var(--sl-color-neutral-600);
    }
    .idea-link a {
      color: var(--sl-color-primary-600);
      text-decoration: none;
    }
    .idea-link a:hover {
      text-decoration: underline;
    }
    .status-tag sl-tag {
      /* Adjust tag size if needed */
      font-weight: var(--sl-font-weight-semibold);
    }
    .bottom-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: var(--sl-spacing-large);
      flex-wrap: wrap; /* Allow wrapping on smaller screens */
      margin-top: var(--sl-spacing-medium); /* Add some space above this row */
    }
    .creator-info {
      display: flex;
      align-items: center;
      gap: var(--sl-spacing-small);
      flex-shrink: 0; /* Prevent creator info from shrinking too much */
    }
    .creator-info span {
      /* Style for the creator name/address */
      font-weight: var(--sl-font-weight-medium);
    }
    .action-buttons {
      display: flex;
      gap: var(--sl-spacing-small);
      flex-wrap: wrap; /* Allow buttons to wrap */
    }
  `;

  render() {
    // TODO: Add loading and error states

    return html`
      <div class="header-container">
        <div class="top-row">
          <div class="title-area">
            <h1>${this._solutionTitle}</h1>
            <div class="idea-link">
              Solution for idea:
              <a href="/idea/${this._ideaId}">${this._ideaName}</a>
            </div>
          </div>
          <div class="status-tag">
            <sl-tag size="large" variant="primary" pill>${this._status}</sl-tag>
          </div>
        </div>

        <div class="bottom-row">
          <div class="creator-info">
            <sl-tooltip content="Solution Drafter">
              <sl-avatar
                image="${this._creatorAvatar || '/default-avatar.png'}"
                label="Creator Avatar"
                initials="${this._creatorName
                  ? ''
                  : /* formatAddress(this._creatorAddress, 2, 0) */ '0x12...'}"
              ></sl-avatar>
            </sl-tooltip>
            <!-- <user-link userId=${this._creatorAddress}></user-link> -->
            <span>${this._creatorName ||
              /* formatAddress(this._creatorAddress) */ this
                ._creatorAddress}</span>
          </div>
          <div class="action-buttons">
            <!-- TODO: Conditionally render buttons based on user role/status -->
            <sl-button variant="success" outline>
              <sl-icon slot="prefix" name="cash-coin"></sl-icon>
              Fund Solution
            </sl-button>
            <sl-button variant="neutral" outline>
              <sl-icon slot="prefix" name="pencil-square"></sl-icon>
              Edit Solution
            </sl-button>
          </div>
        </div>

        <!-- Optional: Funding progress could go here -->
        <!--
          <solution-funding-progress 
            .solutionId=${this.solutionId}
          ></solution-funding-progress>
        -->
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'solution-header': SolutionHeader;
  }
}
