import { customElement, state } from 'lit/decorators.js';
import { css } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { LitElement } from 'lit';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

// Components
import '@layout/page-heading';

// State
import layout from '@state/layout';

// Utils
import { loadForm, formToJson } from '@components/common/saveable-form';
import { formattedText } from '@utils/format-utils';

// Schemas
import ideaSchema from '@schemas/idea-schema.json';

// Styles
import { largeCardStyles } from '@styles/large-card-styles';

export interface IdeaPreviewData {
  name?: string;
  description?: string;
  tags?: string[];
}

@customElement('preview-idea')
export class PreviewIdea extends SignalWatcher(LitElement) {
  @state() private ideaData: IdeaPreviewData = {};
  @state() private hasFormData = false;

  static styles = [
    largeCardStyles,
    css`
      :host {
        display: block;
        container-type: inline-size;
      }

      .container {
        max-width: 70rem;
        margin: 1.5rem 3rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        padding-right: 3rem;
      }

      .preview-card {
        border: 2px dashed var(--accent);
        border-radius: 8px;
        background: var(--card-background);
        padding: 1.5rem;
        max-height: 75vh;
        overflow: scroll;
      }

      .preview-badge {
        background: var(--accent);
        color: var(--sl-color-neutral-0);
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        width: fit-content;
      }

      a {
        color: var(--link);
        text-decoration: underline;
      }

      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      .tag {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        background-color: var(--subtle-background);
        border-radius: 1rem;
        font-size: 0.875rem;
        color: var(--main-foreground);
      }

      .placeholder {
        color: var(--no-results);
        font-style: italic;
      }

      .preview-info {
        color: var(--subtle-text);
        font-size: 0.9rem;
        margin-bottom: 1rem;
        padding: 0.75rem;
        background: var(--subtle-background);
        border-radius: 6px;
      }

      .actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;
      }

      .actions sl-button {
        min-width: 150px;
      }

      .no-data {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--subtle-text);
      }

      .no-data h2 {
        color: var(--main-foreground);
        margin-bottom: 1rem;
      }

      .no-data p {
        margin-bottom: 2rem;
        line-height: 1.6;
      }

      /* Responsive behavior for smaller screens */
      @container (width <= 768px) {
        .container {
          margin: 1rem;
        }

        .actions {
          flex-direction: column;
          align-items: center;
        }

        .actions sl-button {
          width: 100%;
          max-width: 300px;
        }
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    layout.topBarContent.set(html` <page-heading>Preview Your Idea</page-heading> `);
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(false);
    layout.rightSidebarContent.set(html``);

    this.loadIdeaData();
  }

  private loadIdeaData() {
    try {
      // Load form data from localStorage
      const formData = loadForm('create-idea');

      if (formData) {
        // Convert form data to structured idea data using the schema
        const structuredData = formToJson('create-idea', ideaSchema);

        this.ideaData = {
          name: structuredData.name as string,
          description: structuredData.description as string,
          tags: structuredData.tags as string[],
        };

        this.hasFormData = true;
      } else {
        this.hasFormData = false;
      }
    } catch (error) {
      console.error('Error loading idea data:', error);
      this.hasFormData = false;
    }
  }

  private renderPreviewCard() {
    const { name, description, tags } = this.ideaData;

    return html`
      <div class="preview-card card">
        <div class="preview-badge">Preview</div>

        <div class="preview-info">
          This is how your idea will appear to others once submitted.
          <br /><br />
          <strong>💡 Tip:</strong> You can use markdown formatting in your description like **bold**, *italic*, and
          [links](https://example.com) or paste formatted text from other applications.
        </div>

        <div class="card-header">
          <h3 class="entity-name">${name || html`<span class="placeholder">Your idea name will appear here</span>`}</h3>
          <div class="byline">
            <span class="placeholder">by You</span>
          </div>
        </div>

        <ul class="info-row">
          <li>🌱 <span class="placeholder">Just now</span></li>
          <li>🎁 <span class="placeholder">Funder reward will be shown here</span></li>
          <li>🔥 <span class="placeholder">Interest will grow over time</span></li>
        </ul>

        ${description ? html` <p class="description">${formattedText(description)}</p> ` : html``}
        ${tags && tags.length > 0
          ? html` <div class="tags">${tags.map((tag) => html`<span class="tag">${tag}</span>`)}</div> `
          : html`
              <div class="tags">
                <span class="tag placeholder">your-tags</span>
                <span class="tag placeholder">will-appear</span>
                <span class="tag placeholder">here</span>
              </div>
            `}
      </div>
    `;
  }

  render() {
    if (!this.hasFormData) {
      return html`
        <div class="container">
          <div class="no-data">
            <h2>No Idea Data Found</h2>
            <p>
              It looks like you haven't started creating an idea yet, or your form data has expired. Please go back to
              the create idea form to get started.
            </p>
            <sl-button variant="primary" href="/create-idea"> Create New Idea </sl-button>
          </div>
        </div>
      `;
    }

    return html`
      <div class="container">
        <div class="preview-section">${this.renderPreviewCard()}</div>
        <div class="actions">
          <sl-button variant="primary" href="/create-idea"> Back to Edit </sl-button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'preview-idea': PreviewIdea;
  }
}
