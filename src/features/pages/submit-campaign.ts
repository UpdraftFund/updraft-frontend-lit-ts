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

// Utils
import { validateTagsInput } from '@utils/tags/tag-validation';

// Types
import type { Campaign } from '@shared/types/campaign';
import campaignSchema from '@shared/schemas/campaign-schema.json';

// State
import layout from '@state/layout';

@customElement('submit-campaign')
export class SubmitCampaign extends LitElement {
  @query('form', true) form!: HTMLFormElement;
  @query('.alert-container') alertContainer?: HTMLElement;
  @state() private isSubmitting = false;
  @state() private submitMessage = '';
  @state() private submitError = '';
  @state() private fundingItems: Array<{
    id: number;
    token: string;
    amount: string;
  }> = [{ id: 0, token: '', amount: '' }];
  private nextFundingId = 1;

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

    .funding-item-controls {
      display: flex;
      align-items: flex-end;
      gap: 0.5rem;
    }

    .remove-funding-btn {
      min-width: auto;
      padding: 0.5rem;
    }

    .add-funding-btn {
      margin-top: 0.5rem;
    }

    sl-button {
      max-width: fit-content;
    }

    .alert-container {
      margin-bottom: 1rem;
    }

    sl-alert {
      margin-bottom: 1rem;
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

      .funding-item-controls {
        flex-direction: row;
        justify-content: flex-end;
        margin-top: 0.5rem;
      }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(false);
    layout.rightSidebarContent.set(html``);
    layout.topBarContent.set(html`
      <page-heading>Submit a Campaign</page-heading>
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
          alt: imageAlt,
        };
      }

      // Optional link
      const linkUrl = formData.get('linkUrl') as string;
      const linkText = formData.get('linkText') as string;
      if (linkUrl) {
        campaignData.link = {
          url: linkUrl,
          text: linkText,
        };
      }

      // Funding (optional) - collect all funding items
      const fundingItems: Array<{ token: string; amount: number }> = [];
      this.fundingItems.forEach((item) => {
        const token = formData.get(`fundingToken_${item.id}`) as string;
        const amount = formData.get(`fundingAmount_${item.id}`) as string;
        if (token && amount && parseFloat(amount) > 0) {
          fundingItems.push({
            token: token.trim(),
            amount: parseFloat(amount),
          });
        }
      });

      if (fundingItems.length > 0) {
        campaignData.funding = fundingItems;
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
        // Reset funding items to initial state
        this.fundingItems = [{ id: 0, token: '', amount: '' }];
        this.nextFundingId = 1;
        // Scroll to success message
        this.scrollToAlerts();
      } else {
        this.submitError =
          result.error || result.message || 'Failed to submit campaign';
        // Scroll to error message
        this.scrollToAlerts();
      }
    } catch (error) {
      console.error('Error submitting campaign:', error);
      this.submitError = 'Network error. Please try again.';
      // Scroll to error message
      this.scrollToAlerts();
    } finally {
      this.isSubmitting = false;
    }
  }

  private scrollToAlerts() {
    // Use requestAnimationFrame to ensure the DOM has updated
    requestAnimationFrame(() => {
      if (this.alertContainer) {
        this.alertContainer.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    });
  }

  private handleTagsInput(e: Event) {
    const input = e.target as HTMLInputElement;
    validateTagsInput(input, 5, 1); // Max 5 tags, min 1 tag (since field is required)
  }

  private addFundingItem() {
    this.fundingItems = [
      ...this.fundingItems,
      { id: this.nextFundingId++, token: '', amount: '' },
    ];
  }

  private removeFundingItem(id: number) {
    if (this.fundingItems.length > 1) {
      this.fundingItems = this.fundingItems.filter((item) => item.id !== id);
    }
  }

  private handleFundingTokenInput(e: Event, id: number) {
    const input = e.target as HTMLInputElement;
    const itemIndex = this.fundingItems.findIndex((item) => item.id === id);
    if (itemIndex !== -1) {
      this.fundingItems[itemIndex].token = input.value;
      this.requestUpdate();
    }
  }

  private handleFundingAmountInput(e: Event, id: number) {
    const input = e.target as HTMLInputElement;
    const itemIndex = this.fundingItems.findIndex((item) => item.id === id);
    if (itemIndex !== -1) {
      this.fundingItems[itemIndex].amount = input.value;
      this.requestUpdate();
    }
  }

  render() {
    return html`
      <div class="alert-container">
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
      </div>

      <form @submit=${this.handleFormSubmit}>
        <sl-input name="name" required autocomplete="off">
          <label-with-hint
            slot="label"
            label="Campaign Name*"
            hint="A short, descriptive name for your campaign"
          ></label-with-hint>
        </sl-input>

        <sl-textarea name="description" required>
          <label-with-hint
            slot="label"
            label="Description*"
            hint="Briefly describe your campaign and what participants should do."
          ></label-with-hint>
        </sl-textarea>

        <sl-input name="tags" required @sl-input=${this.handleTagsInput}>
          <label-with-hint
            slot="label"
            label="Tags*"
            hint="Enter 1-5 tags separated by spaces that uniquely identify your campaign. Use hyphens for multi-word-tags."
          ></label-with-hint>
        </sl-input>

        <div class="form-row">
          <sl-input name="imageUrl" type="url">
            <label-with-hint
              slot="label"
              label="Image URL"
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
              label="Link URL"
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
          <h3>Funding Commitment</h3>
          ${this.fundingItems.map(
            (item, index) => html`
              <div class="funding-item">
                <sl-input
                  name="fundingToken_${item.id}"
                  placeholder="UPD"
                  .value=${item.token}
                  @sl-input=${(e: Event) =>
                    this.handleFundingTokenInput(e, item.id)}
                >
                  <label-with-hint
                    slot="label"
                    label="Token Symbol ${this.fundingItems.length > 1
                      ? `#${index + 1}`
                      : ''}"
                    hint="Symbol of the token you're committing"
                  ></label-with-hint>
                </sl-input>
                <sl-input
                  name="fundingAmount_${item.id}"
                  type="number"
                  step="any"
                  min="0"
                  .value=${item.amount}
                  @sl-input=${(e: Event) =>
                    this.handleFundingAmountInput(e, item.id)}
                >
                  <label-with-hint
                    slot="label"
                    label="Amount ${this.fundingItems.length > 1
                      ? `#${index + 1}`
                      : ''}"
                    hint="Number of tokens you're committing to the campaign"
                  ></label-with-hint>
                </sl-input>
                <div class="funding-item-controls">
                  ${this.fundingItems.length > 1
                    ? html`
                        <sl-button
                          type="button"
                          variant="default"
                          size="small"
                          class="remove-funding-btn"
                          @click=${() => this.removeFundingItem(item.id)}
                        >
                          Remove
                        </sl-button>
                      `
                    : ''}
                </div>
              </div>
            `
          )}
          <sl-button
            type="button"
            variant="default"
            size="small"
            class="add-funding-btn"
            @click=${this.addFundingItem}
          >
            Add Another Token
          </sl-button>
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
