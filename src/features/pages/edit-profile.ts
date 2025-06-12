import { customElement, state, property, query } from 'lit/decorators.js';
import { css } from 'lit';
import { TaskStatus } from '@lit/task';
import { SignalWatcher, html } from '@lit-labs/signals';
import { parseUnits, toHex, trim } from 'viem';
import dayjs from 'dayjs';

// Icons
import pencilSquare from '@icons/common/pencil-square.svg';

// Styles
import { dialogStyles } from '@styles/dialog-styles';

// Shoelace components
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import { SlDialog } from '@shoelace-style/shoelace';

// Components
import '@layout/page-heading';
import '@components/user/activity-feed';
import '@components/common/transaction-watcher';
import '@components/common/upd-dialog';
import '@components/common/share-dialog';
import '@components/common/token-input';
import '@components/common/formatted-text-input';
import '@components/common/label-with-hint';
import { ITokenInput } from '@components/common/token-input';
import {
  TransactionWatcher,
  TransactionSuccess,
} from '@components/common/transaction-watcher';
import { UpdDialog } from '@components/common/upd-dialog';
import { ShareDialog } from '@components/common/share-dialog';
import {
  SaveableForm,
  loadForm,
  formToJson,
  clearForm,
} from '@components/common/saveable-form';

// State
import layout from '@state/layout';
import { defaultFunderReward } from '@state/common';
import {
  userAddress,
  userProfile,
  isConnected,
  setUserProfile,
  connectWallet,
  setProfileImage,
} from '@state/user';
import { updraftSettings } from '@state/common';
import { markComplete } from '@state/user/beginner-tasks';

// Utilities
import { capitalize } from '@utils/format-utils';

// Schemas
import ideaSchema from '@schemas/idea-schema.json';
import solutionSchema from '@schemas/solution-schema.json';
import profileSchema from '@schemas/profile-schema.json';
import { Profile } from '@/types/user/profile';

// Contracts
import { updraft } from '@contracts/updraft';

@customElement('edit-profile')
export class EditProfile extends SignalWatcher(SaveableForm) {
  static styles = [
    dialogStyles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        flex: 1;
        box-sizing: border-box;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        margin: 1rem 3rem;
      }

      user-avatar {
        --avatar-size: 64px;
      }

      .avatar {
        position: relative;
        background: var(--main-background);
        border-radius: 50%;
        width: 64px;
        height: 64px;
        aspect-ratio: 1/1;
        padding: 0.2rem;
        cursor: pointer;
        display: flex;
      }

      .avatar:hover {
        background: var(--control-background);
      }

      .avatar .edit-icon {
        color: var(--main-foreground);
        background: inherit;
        position: absolute;
        bottom: 0;
        right: 0;
        border-radius: 50%;
        padding: 0.2rem;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }

      .avatar input {
        display: none; /* Hide the file input */
      }

      .links-section p {
        margin: 0;
      }

      .links-section .link-input {
        margin-top: 0.5rem;
      }

      .link-container {
        display: flex;
        align-items: center;
        margin-bottom: 0.25rem;
      }

      .remove-link-button {
        --sl-input-height-medium: 1rem;
      }

      .submit-button {
        width: fit-content;
      }

      transaction-watcher.submit {
        padding-bottom: 4rem;
        align-self: center;
      }
    `,
  ];

  @property() entity: string | undefined;

  @state() private links: { name: string; value: string }[] = [];
  @state() private editingLinks: boolean = false;

  @query('upd-dialog', true) updDialog!: UpdDialog;
  @query('transaction-watcher.submit', true)
  submitTransaction!: TransactionWatcher;
  @query('transaction-watcher.approve', true)
  approveTransaction!: TransactionWatcher;
  @query('sl-dialog', true) approveDialog!: SlDialog;
  @query('share-dialog', true) shareDialog!: ShareDialog;
  @query('token-input', true) tokenInput!: ITokenInput;

  private handleInput() {
    this.submitTransaction.reset();
  }

  private handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/src/assets/icons/link-45deg.svg'; // Fallback icon
  }

  private handleFormSubmit(e: Event) {
    e.preventDefault(); // Prevent the default form submission when Enter is pressed
  }

  private async handleSubmit() {
    // Don't allow overlapping transactions
    if (this.submitTransaction.transactionTask.status !== TaskStatus.PENDING) {
      const profileData = {
        ...formToJson('edit-profile', profileSchema),
        image: userProfile.get()?.image,
      } as Profile;

      // Update new user state with signals
      setUserProfile(profileData);

      const settings = updraftSettings.get();

      try {
        if (this.entity === 'idea') {
          const ideaData = formToJson('create-idea', ideaSchema);
          const ideaForm = loadForm('create-idea');
          if (ideaForm) {
            this.submitTransaction.hash = await updraft.write(
              'createIdeaWithProfile',
              [
                BigInt(defaultFunderReward.get()),
                parseUnits(ideaForm.deposit, 18),
                toHex(JSON.stringify(ideaData)),
                toHex(JSON.stringify(profileData)),
              ]
            );
            this.shareDialog.topic = ideaData.name as string;
          }
        } else if (this.entity === 'solution') {
          // Handle solution creation with profile update
          const solutionData = formToJson('create-solution', solutionSchema);
          const solutionForm = loadForm('create-solution-two');

          if (solutionForm) {
            // Format the deadline date properly
            const deadline = dayjs(solutionForm.deadline).unix();

            this.submitTransaction.hash = await updraft.write(
              'createSolutionWithProfile',
              [
                solutionForm.ideaId,
                solutionForm.fundingToken,
                parseUnits(solutionForm.stake, 18),
                parseUnits(solutionForm.goal, 18),
                deadline,
                BigInt(
                  (Number(solutionForm.reward) *
                    Number(settings.percentScale)) /
                    100
                ),
                toHex(JSON.stringify(solutionData)),
                toHex(JSON.stringify(profileData)),
              ]
            );
            this.shareDialog.topic = solutionData.name as string;
          }
        } else {
          console.log('Submitting profile update');
          this.submitTransaction.hash = await updraft.write('updateProfile', [
            toHex(JSON.stringify(profileData)),
          ]);
        }
      } catch (e) {
        console.error('Profile update error:', e);

        // Use token-input's error handling
        this.tokenInput.handleTransactionError(
          e,
          () => this.handleSubmit(), // Retry after approval
          () => this.updDialog.show() // Show UPD dialog on low balance
        );
      }
    }
  }

  private async handleSubmitSuccess(t: TransactionSuccess) {
    if (this.entity) {
      let show;
      if (this.entity === 'idea') {
        clearForm('create-idea');
        const address = t.receipt?.logs?.[0]?.topics?.[1];
        if (address) {
          this.shareDialog.url = `${window.location.origin}/idea/${trim(address)}`;
          this.shareDialog.action = 'created an Idea';
          show = true;
        }
      } else if (this.entity === 'solution') {
        clearForm('create-solution');
        clearForm('create-solution-two');
        const address = t.receipt?.logs?.[1]?.topics?.[1];
        const ideaId = t.receipt?.logs?.[1]?.topics?.[3];
        if (address && ideaId) {
          this.shareDialog.url = `${window.location.origin}/solution/${trim(address)}`;
          this.shareDialog.action = 'created a Solution';
          show = true;
        }
      }
      if (show) {
        this.shareDialog.show();
      }
    }
    markComplete('create-profile');
  }

  private async handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  private resetLinksFromSavedForm() {
    const savedForm = loadForm(this.form.name);
    if (savedForm) {
      this.links = Object.entries(savedForm)
        .filter(([key, value]) => key.startsWith('link') && value.trim() !== '')
        .map(([name, value]) => ({ name, value }));
    }
  }

  private resetLinksFromProfile() {
    if (!this.editingLinks) {
      const profileLinks = userProfile.get()?.links;
      if (profileLinks?.length) {
        this.links = profileLinks
          .filter((link) => link.trim() !== '')
          .map((link, i) => ({
            name: `link${i}`,
            value: link,
          }));
      } else {
        this.links = [];
      }
    }
  }

  private addEmptyLink() {
    this.links = [
      ...this.links,
      { name: `link${this.links.length}`, value: '' },
    ];
    this.editingLinks = true;
  }

  private removeLink(index: number) {
    this.links = this.links.filter((_, i) => i !== index);
    this.editingLinks = true;
  }

  private handleLinkInput(event: InputEvent, index: number) {
    const input = event.target as HTMLInputElement;
    this.links[index] = { ...this.links[index], value: input.value };
    this.editingLinks = true;
  }

  private renderLinks() {
    if (!this.links.length) {
      this.addEmptyLink();
    }
    this.editingLinks = false;
    return this.links.map(
      (link, index) => html`
        <div class="link-container">
          <sl-input
            class="link-input"
            autocomplete="url"
            .name=${link.name}
            .value=${link.value}
            @input=${(e: InputEvent) => this.handleLinkInput(e, index)}
          >
            <img
              slot="prefix"
              src=${`https://www.google.com/s2/favicons?domain=${link.value || '.'}&sz=16`}
              @error=${(e: Event) => this.handleImageError(e)}
              alt="Logo for ${link.value}"
              width="16px"
              height="16px"
            />
          </sl-input>
          <sl-button
            class="remove-link-button"
            variant="text"
            @click=${() => this.removeLink(index)}
          >
            Remove
          </sl-button>
        </div>
      `
    );
  }

  connectedCallback() {
    super.connectedCallback();
    if (!isConnected.get()) {
      connectWallet();
    }
    layout.topBarContent.set(
      html` <page-heading>Edit Your Profile</page-heading>`
    );
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(true);
  }

  firstUpdated(changedProperties: Map<string | number | symbol, unknown>) {
    super.firstUpdated(changedProperties);
    this.resetLinksFromSavedForm();
  }

  render() {
    layout.rightSidebarContent.set(
      html` <activity-feed
        .userId=${userAddress.get()}
        .userName=${'You'}
      ></activity-feed>`
    );
    const profile = userProfile.get();
    const avatar = profile?.avatar;
    this.resetLinksFromProfile();
    return html`
      <form
        name="edit-profile"
        @submit=${this.handleFormSubmit}
        @input=${this.handleInput}
      >
        <label class="avatar">
          <user-avatar
            .address=${userAddress.get()}
            .image=${avatar}
          ></user-avatar>
          <input
            type="file"
            accept="image/*"
            @change=${this.handleImageUpload}
          />
          <sl-icon
            class="edit-icon"
            src="${pencilSquare}"
            label="Edit image"
          ></sl-icon>
        </label>
        <sl-input
          name="name"
          label="Name"
          required
          autocomplete="name"
          .value=${profile?.name || ''}
        ></sl-input>
        <sl-input
          name="team"
          label="Team"
          autocomplete="organization"
          .value=${profile?.team || ''}
        ></sl-input>
        <formatted-text-input name="about" .value=${profile?.about || ''}>
          <label-with-hint
            slot="label"
            label="About"
            hint="Tell people about yourself or your team. You can use markdown or paste formatted text."
          ></label-with-hint>
        </formatted-text-input>
        <formatted-text-input name="news" .value=${profile?.news || ''}>
          <label-with-hint
            slot="label"
            label="News"
            hint="Your latest updates. You can use markdown or paste formatted text."
          ></label-with-hint>
        </formatted-text-input>
        <div class="links-section">
          <p>Links</p>
          ${this.renderLinks()}
          <sl-button variant="text" @click=${this.addEmptyLink}>
            + Add Link
          </sl-button>
        </div>
        <sl-button
          class="submit-button"
          variant="primary"
          @click=${this.handleSubmit}
        >
          Submit Profile
          ${this.entity ? 'and Create ' + capitalize(this.entity) : ''}
        </sl-button>
        <transaction-watcher
          class="submit"
          @transaction-success=${this.handleSubmitSuccess}
        ></transaction-watcher>
      </form>
      <!-- Hidden token-input for transaction handling -->
      <token-input
        .showInputControl=${false}
        spendingContract=${updraft.address}
        spendingContractName="Updraft"
      ></token-input>

      <upd-dialog></upd-dialog>
      <sl-dialog label="Set Allowance">
        <p>
          Before you can submit your profile, you need to sign a transaction to
          allow Updraft to spend your UPD tokens.
        </p>
        <transaction-watcher
          class="approve"
          @transaction-success=${this.handleSubmit}
        ></transaction-watcher>
      </sl-dialog>
      <share-dialog></share-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'edit-profile': EditProfile;
  }
}
