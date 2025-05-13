import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/tag/tag.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/avatar/avatar.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';

// GraphQL
import { SolutionDocument } from '@gql';
import { UrqlQueryController } from '@utils/urql-query-controller';

// Utils
import { shortenAddress, parseProfile } from '@utils/format-utils';

@customElement('solution-page')
export class SolutionPage extends LitElement {
  @property({ type: String })
  solutionId?: string;

  // Internal state for fetched data
  @state() private _solutionTitle = '';
  @state() private _status = '';
  @state() private _ideaId = '';
  @state() private _ideaName = '';
  @state() private _creatorAddress = '';
  @state() private _creatorName = '';
  @state() private _creatorAvatar = '';

  // State for loading and error handling
  @state() private _isLoading = false;
  @state() private _error?: string;

  // Controller for fetching solution data
  private readonly solutionController = new UrqlQueryController(
    this,
    SolutionDocument,
    { solutionId: this.solutionId || '' },
    (result) => {
      this._isLoading = false;

      if (result.error) {
        console.error('Error fetching solution data:', result.error);
        this._error = `Error loading solution: ${result.error.message}`;
        return;
      }

      if (result.data?.solution) {
        const { solution } = result.data;
        this._solutionTitle = solution.idea?.name || 'Untitled Solution';
        this._ideaId = solution.idea?.id || '';
        this._ideaName = solution.idea?.name || 'Unknown Idea';
        this._creatorAddress = solution.drafter?.id || '';
        const profile = parseProfile(solution.drafter.profile);
        this._creatorName = profile.name || '';
        this._creatorAvatar = profile.image || '';
      } else {
        this._error = 'Solution not found.';
      }
    }
  );

  // --- Styles ---

  static styles = css`
    .solution-content {
      display: block;
    }

    .header-container {
      display: flex;
      flex-direction: column;
      gap: var(--sl-spacing-medium);
      margin-bottom: var(--sl-spacing-large);
      padding: var(--sl-spacing-large);
      border: 1px solid var(--sl-color-neutral-200);
      border-radius: var(--sl-radius-medium);
      background-color: var(--sl-color-neutral-50);
      position: relative; /* For loading overlay */
      min-height: 150px; /* Ensure space for spinner */
    }
    .loading-overlay,
    .error-message {
      position: absolute;
      inset: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(255, 255, 255, 0.8);
      border-radius: var(--sl-radius-medium);
      text-align: center;
      padding: var(--sl-spacing-large);
    }
    .error-message {
      color: var(--sl-color-danger-700);
      font-weight: var(--sl-font-weight-medium);
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

  // --- Lifecycle Methods ---

  protected updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);

    // Update controller variables if solutionId changes
    if (changedProperties.has('solutionId') && this.solutionId) {
      this._isLoading = true;
      this._error = undefined; // Clear previous errors
      this.solutionController.setVariablesAndSubscribe({
        solutionId: this.solutionId,
      });
    }
  }

  render() {
    if (!this.solutionId) {
      // Handle case where solutionId is missing
      return html` <p>Solution not found or ID missing.</p> `;
    }

    return html`
      <div class="solution-content container mx-auto px-4 py-8">
        <div class="header-container">
          ${this._isLoading
            ? html`<div class="loading-overlay">
                <sl-spinner style="font-size: 2rem;"></sl-spinner>
              </div>`
            : ''}
          ${this._error
            ? html`<div class="error-message">${this._error}</div>`
            : ''}
          ${!this._isLoading && !this._error
            ? html`
                <div class="top-row">
                  <div class="title-area">
                    <h1>${this._solutionTitle}</h1>
                    <div class="idea-link">
                      Solution for idea:
                      <a href="/idea/${this._ideaId}" title="View linked Idea"
                        >${this._ideaName}</a
                      >
                    </div>
                  </div>
                  <div class="status-tag">
                    <sl-tag size="large" variant="primary" pill
                      >${this._status}</sl-tag
                    >
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
                          : shortenAddress(this._creatorAddress).substring(
                              0,
                              6
                            )}"
                      ></sl-avatar>
                    </sl-tooltip>
                    <!-- <user-link userId=${this
                      ._creatorAddress}></user-link> -->
                    <span
                      >${this._creatorName ||
                      shortenAddress(this._creatorAddress)}</span
                    >
                  </div>
                  <div class="action-buttons">
                    <!-- TODO: Conditionally render buttons based on user role/status -->
                    <sl-button variant="success" outline>Fund</sl-button>
                    <sl-button variant="primary">Edit</sl-button>
                  </div>
                </div>
              `
            : ''}
        </div>

        <!-- Additional solution content can be added here -->
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'solution-page': SolutionPage;
  }
}
