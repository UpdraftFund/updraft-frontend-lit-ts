import { customElement, state, query } from 'lit/decorators.js';
import { html, css } from 'lit';
import { LitElement } from 'lit';
import Ajv from 'ajv';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/alert/alert.js';

// Components
import '@layout/page-heading';
import '@components/common/label-with-hint';
import '@components/common/formatted-text-input';

// Utils
import { validateTagsInput } from '@utils/tags/tag-validation';

// Types
import type { Campaign } from '@/types';
import campaignSchema from '@/types/domain/campaign-schema.json';

// State
import layout from '@state/layout';

@customElement('submit-campaign')
export class SubmitCampaign extends LitElement {
  @query('form', true) form!: HTMLFormElement;
  @state() private isSubmitting = false;
  @state() private submitMessage = '';
  @state() private submitError = '';

  static styles = css`
    :host {
      display: block;
      max-width: 70rem;
      margin: 1.5rem 3rem;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
    }

    .form-row sl-input {
      flex: 1;
    }

    .funding-section {
      border: 1px solid var(--sl-color-neutral-300);
      border-radius: 6px;
      padding: 1rem;
      background: var(--sl-color-neutral-50);
    }

    .funding-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      color: var(--main-foreground);
    }

    .funding-item {
      display: flex;
      gap: 1rem;
      margin-bottom: 0.5rem;
      align-items: flex-end;
    }

    .funding-item sl-input {
      flex: 1;
    }

    sl-button {
      max-width: fit-content;
    }

    sl-alert {
      margin-bottom: 1rem;
    }

    .tags-hint {
      font-size: 0.875rem;
      color: var(--subtle-text);
      margin-top: 0.25rem;
    }

    /* Responsive behavior for smaller screens */
    @media (max-width: 768px) {
      :host {
        margin: 1rem;
      }

      .form-row {
        flex-direction: column;
        align-items: stretch;
      }

      .funding-item {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(false);
    layout.rightSidebarContent.set(html``);
    layout.topBarContent.set(html`
      <page-heading>
        <h1>Submit Campaign</h1>
        <p>Submit a new campaign for review and approval</p>
      </page-heading>
    `);
  }

  private handleFormSubmit(e: Event) {
    e.preventDefault();
    this.submitCampaign();
  }

  private async submitCampaign() {
    if (!this.form.checkValidity()) {
      this.form.reportValidity();
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.submitMessage = '';

    try {
      // Collect form data
      const formData = new FormData(this.form);
      const campaignData: Partial<Campaign> = {};

      // Basic fields
      campaignData.name = formData.get('name') as string;
      campaignData.description = formData.get('description') as string;

      // Tags (space-separated)
      const tagsValue = formData.get('tags') as string;
      if (tagsValue) {
        const tags = tagsValue.split(/\s+/);
        if (tags.length <= 5) {
          campaignData.tags = tags as Campaign['tags'];
        } else {
          campaignData.tags = tags.slice(0, 5) as Campaign['tags'];
        }
      }

      // Optional image
      const imageUrl = formData.get('imageUrl') as string;
      const imageAlt = formData.get('imageAlt') as string;
      if (imageUrl) {
        campaignData.image = {
          url: imageUrl,
          alt: imageAlt || campaignData.name,
        };
      }

      // Optional link
      const linkUrl = formData.get('linkUrl') as string;
      const linkText = formData.get('linkText') as string;
      if (linkUrl) {
        campaignData.link = {
          url: linkUrl,
          text: linkText || 'Learn more',
        };
      }

      // Funding (optional)
      const fundingToken = formData.get('fundingToken') as string;
      const fundingAmount = formData.get('fundingAmount') as string;
      if (fundingToken && fundingAmount) {
        campaignData.funding = [
          {
            token: fundingToken,
            amount: parseFloat(fundingAmount),
          },
        ];
      }

      // Validate against schema
      const ajv = new Ajv();
      const validate = ajv.compile(campaignSchema);

      if (!validate(campaignData)) {
        const errorMessages = validate.errors
          ?.map((err) => `${err.instancePath} ${err.message}`)
          .join(', ');
        this.submitError = `Validation failed: ${errorMessages}`;
        return;
      }

      // Submit to API
      const response = await fetch('/api/campaigns/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(campaignData),
      });

      const result = await response.json();

      if (response.ok) {
        this.submitMessage = result.message;
        this.form.reset();
      } else {
        this.submitError =
          result.error || result.message || 'Failed to submit campaign';
      }
    } catch (error) {
      console.error('Error submitting campaign:', error);
      this.submitError = 'Network error. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private handleTagsInput(e: Event) {
    const input = e.target as HTMLInputElement;
    validateTagsInput(input, 5, 1); // Max 5 tags, min 1 tag (since field is required)
  }

  render() {
    return html`
      ${this.submitMessage
        ? html`
            <sl-alert variant="success" open>
              <sl-icon slot="icon" name="check2-circle"></sl-icon>
              ${this.submitMessage}
            </sl-alert>
          `
        : ''}
      ${this.submitError
        ? html`
            <sl-alert variant="danger" open>
              <sl-icon slot="icon" name="exclamation-octagon"></sl-icon>
              ${this.submitError}
            </sl-alert>
          `
        : ''}

      <form @submit=${this.handleFormSubmit}>
        <sl-input name="name" required autocomplete="off">
          <label-with-hint
            slot="label"
            label="Campaign Name*"
            hint="A short, descriptive name for your campaign"
          ></label-with-hint>
        </sl-input>

        <formatted-text-input name="description" required>
          <label-with-hint
            slot="label"
            label="Description*"
            hint="Describe your campaign and what participants should do. You can use markdown formatting."
          ></label-with-hint>
        </formatted-text-input>

        <sl-input name="tags" required @sl-input=${this.handleTagsInput}>
          <label-with-hint
            slot="label"
            label="Tags*"
            hint="Enter 1-5 tags separated by spaces. Use hyphens for multi-word-tags."
          ></label-with-hint>
        </sl-input>
        <div class="tags-hint">
          Tags help participants find relevant ideas. Example: crypto web3 defi
        </div>

        <div class="form-row">
          <sl-input name="imageUrl" type="url">
            <label-with-hint
              slot="label"
              label="Image URL (Optional)"
              hint="URL to an image that represents your campaign"
            ></label-with-hint>
          </sl-input>
          <sl-input name="imageAlt">
            <label-with-hint
              slot="label"
              label="Image Alt Text"
              hint="Describe the image for accessibility"
            ></label-with-hint>
          </sl-input>
        </div>

        <div class="form-row">
          <sl-input name="linkUrl" type="url">
            <label-with-hint
              slot="label"
              label="Link URL (Optional)"
              hint="Link to more information about your campaign"
            ></label-with-hint>
          </sl-input>
          <sl-input name="linkText">
            <label-with-hint
              slot="label"
              label="Link Text"
              hint="Text to display for the link"
            ></label-with-hint>
          </sl-input>
        </div>

        <div class="funding-section">
          <h3>Funding Commitment (Optional)</h3>
          <div class="funding-item">
            <sl-input name="fundingToken" placeholder="UPD">
              <label-with-hint
                slot="label"
                label="Token Symbol"
                hint="Symbol of the token you're committing"
              ></label-with-hint>
            </sl-input>
            <sl-input name="fundingAmount" type="number" step="any" min="0">
              <label-with-hint
                slot="label"
                label="Amount"
                hint="Amount of tokens you're committing to the campaign"
              ></label-with-hint>
            </sl-input>
          </div>
        </div>

        <sl-button
          type="submit"
          variant="primary"
          ?loading=${this.isSubmitting}
          ?disabled=${this.isSubmitting}
        >
          ${this.isSubmitting ? 'Submitting...' : 'Submit Campaign'}
        </sl-button>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'submit-campaign': SubmitCampaign;
  }
}
