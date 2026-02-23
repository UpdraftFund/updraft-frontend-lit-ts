import { customElement, query, state } from 'lit/decorators.js';
import { css } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';
import { parseUnits, toHex, trim } from 'viem';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import type { SlInput, SlDialog, SlSelect } from '@shoelace-style/shoelace';

// Components
import '@layout/page-heading';
import '@components/common/label-with-hint';
import '@components/common/upd-dialog';
import '@components/common/share-dialog';
import '@components/common/transaction-watcher';
import '@components/common/token-input';
import '@components/common/formatted-text-input';
import { ITokenInput } from '@components/common/token-input';
import { UpdDialog } from '@components/common/upd-dialog';
import { ShareDialog } from '@components/common/share-dialog';
import { TransactionWatcher, TransactionSuccess } from '@components/common/transaction-watcher';
import { SaveableForm, formToJson } from '@components/common/saveable-form';

// Styles
import { dialogStyles } from '@styles/dialog-styles';

// State
import layout from '@state/layout';
import { hasProfile } from '@state/user';
import { defaultFunderReward } from '@state/common';

// Contracts
import { updraft } from '@contracts/updraft';
import { type BatchCall } from '@/lib/zerodev/passkeyConnector';

// Schemas
import ideaSchema from '@schemas/idea-schema.json';

// Types
import type { CampaignTags } from '@shared/types/campaigns';

// Utils
import { normalizeAndValidateTagsInput } from '@utils/tags/tag-validation';

@customElement('create-idea')
export class CreateIdea extends SignalWatcher(SaveableForm) {
  @query('upd-dialog', true) updDialog!: UpdDialog;
  @query('share-dialog', true) shareDialog!: ShareDialog;
  @query('transaction-watcher.submit', true)
  submitTransaction!: TransactionWatcher;
  @query('transaction-watcher.approve', true)
  approveTransaction!: TransactionWatcher;
  @query('sl-dialog', true) approveDialog!: SlDialog;
  @query('token-input', true) tokenInput!: ITokenInput;
  @query('sl-select[name="campaign"]', true) campaignSelect!: SlSelect;
  @query('sl-input[name="tags"]', true) tagsInput!: SlInput;

  @state() private campaigns: CampaignTags[] = [];

  static styles = [
    dialogStyles,
    css`
      :host {
        container-type: inline-size;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        max-width: 70rem;
        margin: 1.5rem 3rem;
      }

      .deposit-row {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 0.25rem;
      }

      .deposit-row > sl-button {
        flex-shrink: 0; /* Prevents the button from shrinking */
      }

      sl-input[name='deposit'] {
        flex: none;
        width: calc(10ch + var(--sl-input-spacing-medium) * 2);
        box-sizing: content-box;
      }

      sl-input[name='deposit']::part(input) {
        text-align: right;
      }

      sl-input[name='deposit'].invalid {
        --sl-input-focus-ring-color: red;
      }

      .submit {
        width: fit-content;
      }

      .button-row {
        display: flex;
        gap: 1rem;
        align-items: center;
        flex-wrap: wrap;
      }

      .tags-row {
        display: flex;
        gap: 1rem;
        align-items: end;
      }

      .tags-row > sl-input {
        flex: 1 1 65%;
      }

      .tags-row > sl-select {
        flex: 1 1 35%;
      }

      /* Responsive behavior for smaller screens */
      @container (width <= 768px) {
        form {
          margin: 1rem;
        }

        .tags-row {
          flex-direction: column;
          align-items: stretch;
        }

        .button-row {
          flex-direction: column;
          align-items: stretch;
        }

        .button-row sl-button {
          width: 100%;
        }
      }
    `,
  ];

  private handleTagsInput(e: Event) {
    const input = e.target as SlInput;
    normalizeAndValidateTagsInput(input);
  }

  private nextButtonClick(e: MouseEvent) {
    if (!this.form.checkValidity()) {
      e.preventDefault(); // If the form is invalid, prevent the click
      this.form.reportValidity(); // Show validation messages
    }
  }

  private handleFormSubmit(e: Event) {
    e.preventDefault(); // Prevent the default form submission when Enter is pressed
  }

  private async createIdea() {
    if (!this.form.checkValidity()) {
      this.form.reportValidity(); // Show validation messages
      return;
    }

    const ideaData = formToJson('create-idea', ideaSchema);

    const createIdeaArgs = [
      BigInt(defaultFunderReward.get()),
      parseUnits(this.tokenInput.value, 18),
      toHex(JSON.stringify(ideaData)),
    ];

    try {
      this.submitTransaction.hash = await updraft.write('createIdea', createIdeaArgs);
      this.shareDialog.topic = ideaData.name as string;
    } catch (e) {
      const originalCall: BatchCall = {
        to: updraft.address,
        abi: updraft.abi,
        functionName: 'createIdea',
        args: createIdeaArgs,
      };
      this.tokenInput.handleTransactionError(
        e,
        () => this.createIdea(), // Retry after approval (EOA)
        () => this.updDialog.show(), // Show UPD dialog on low balance
        originalCall,
        (txHash) => {
          this.submitTransaction.hash = txHash;
        } // Batch success (smart account)
      );
    }
  }

  private async handleTransactionSuccess(t: TransactionSuccess) {
    this.form.reset();
    this.clearForm();
    const address = t.receipt?.logs?.[0]?.topics?.[1];
    if (address) {
      this.shareDialog.url = `${window.location.origin}/idea/${trim(address)}`;
      this.shareDialog.action = 'created an Idea';
      this.shareDialog.show();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    layout.topBarContent.set(html` <page-heading>Create a new Idea</page-heading> `);
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(false);
    layout.rightSidebarContent.set(html``);

    // Fetch campaigns for the dropdown
    this.fetchCampaigns();
  }

  private async fetchCampaigns() {
    try {
      const response = await fetch('/api/campaigns/tags');
      if (response.ok) {
        this.campaigns = await response.json();
        console.log('Campaigns:', this.campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  }

  private handleCampaignSelection(e: Event) {
    const select = e.target as SlSelect;
    const selectedCampaignId = parseInt(select.value as string);
    const selectedCampaign = this.campaigns.find((c) => c.id === selectedCampaignId);

    if (this.tagsInput) {
      if (selectedCampaign) {
        // Set the tags input to the campaign's tags
        this.tagsInput.value = selectedCampaign.tags.join(' ');
      } else {
        // Clear the tags input when no campaign is selected
        this.tagsInput.value = '';
      }
    }
  }

  updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
  }

  render() {
    console.log('Render campaigns:', this.campaigns);
    return html`
      <form name="create-idea" @submit=${this.handleFormSubmit}>
        <sl-input name="name" required autocomplete="off">
          <label-with-hint slot="label" label="Name*" hint="A short name for your idea"></label-with-hint>
        </sl-input>
        <formatted-text-input name="description">
          <label-with-hint
            slot="label"
            label="Description"
            hint="How do you want to make your community, your project or the world better?"
          ></label-with-hint>
        </formatted-text-input>
        <div class="tags-row">
          <sl-input name="tags" @sl-input=${this.handleTagsInput}>
            <label-with-hint
              slot="label"
              label="Tags"
              hint="Enter up to five tags separated by spaces to help people find your idea.
                  Use hyphens for multi-word-tags. Select a campaign to add its tags."
            >
            </label-with-hint>
          </sl-input>
          <sl-select name="campaign" placeholder="Select campaign" clearable @sl-change=${this.handleCampaignSelection}>
            <label slot="label">Campaign</label>
            ${this.campaigns.map((campaign) => html` <sl-option value=${campaign.id}>${campaign.name}</sl-option> `)}
          </sl-select>
        </div>
        <div class="deposit-container">
          <label-with-hint
            label="Deposit*"
            hint="The initial UPD tokens you will deposit. The more you deposit, the more you stand
                to earn from supporters of your idea. As a creator, you can always withdraw your full
                initial deposit minus the anti-spam fee of 1 UPD or 1% (whichever is greater)."
          >
          </label-with-hint>
          <div class="deposit-row">
            <token-input
              name="deposit"
              required
              spendingContract=${updraft.address}
              spendingContractName="Updraft"
              antiSpamFeeMode="variable"
              showDialogs="false"
            >
              <sl-button slot="invalid" variant="primary" @click=${() => this.updDialog.show()}>
                Get more UPD
              </sl-button>
            </token-input>
          </div>
        </div>
        <div class="button-row">
          <sl-button variant="default" href="/preview-idea"> Preview </sl-button>

          ${hasProfile.get()
            ? html` <sl-button class="submit" variant="primary" @click=${this.createIdea}> Create Idea </sl-button>`
            : html`<a class="submit" href="/submit-profile-and-create-idea" rel="next">
                <sl-button variant="primary" @click=${this.nextButtonClick}> Next: Create your Profile </sl-button>
              </a>`}
        </div>
        <transaction-watcher class="submit" @transaction-success=${this.handleTransactionSuccess}></transaction-watcher>
      </form>
      <upd-dialog></upd-dialog>
      <share-dialog></share-dialog>
      <sl-dialog label="Set Allowance">
        <p>
          Before you can create your idea, you need to sign a transaction to allow Updraft to spend your UPD tokens.
        </p>
        <transaction-watcher
          class="approve"
          @transaction-success=${() => {
            this.approveDialog.hide();
            this.createIdea();
          }}
        ></transaction-watcher>
      </sl-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'create-idea': CreateIdea;
  }
}
