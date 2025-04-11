import { customElement, state, property, query } from 'lit/decorators.js';
import { css } from 'lit';
import { TaskStatus, Task } from '@lit/task';
import { SignalWatcher, html } from '@lit-labs/signals';
import { parseUnits, toHex, trim } from 'viem';
import dayjs from 'dayjs';

import { CurrentUser, UpdraftSettingsProvider } from '@/types';

import pencilSquare from '@icons/user/pencil-square.svg';

import { dialogStyles } from '@/features/common/styles/dialog-styles';

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@components/common/page-heading';
import '@components/user/activity-feed';
import '@components/common/transaction-watcher';
import '@components/user/user-avatar';
import '@components/common/upd-dialog';
import '@components/common/share-dialog';
import {
  TransactionWatcher,
  TransactionSuccess,
} from '@components/common/transaction-watcher';
import { UpdDialog } from '@components/common/upd-dialog';
import { ShareDialog } from '@components/common/share-dialog';
import { SlDialog } from '@shoelace-style/shoelace';
import {
  SaveableForm,
  loadForm,
  formToJson,
} from '@components/common/saveable-form';

import { topBarContent } from '@state/layout';
import { updraft } from '@contracts/updraft';
import { Upd } from '@contracts/upd';
import { user, defaultFunderReward } from '@state/common/context';
import {
  userAddress,
  userProfile,
  isConnected,
  setUserProfile,
  connectWallet,
  USER_CONNECTED_EVENT,
  USER_DISCONNECTED_EVENT,
  USER_PROFILE_UPDATED_EVENT,
} from '@state/user/user';

import ideaSchema from '@schemas/idea-schema.json';
import profileSchema from '@schemas/profile-schema.json';

@customElement('edit-profile')
export class EditProfile extends SignalWatcher(SaveableForm) {
  static styles = [
    dialogStyles,
    css`
      activity-feed {
        flex: 0 0 789px; /* Activity feed width is fixed */
      }

      .container {
        display: flex;
        flex: auto; /* The container takes the remaining available space */
        overflow: hidden;
      }

      main {
        flex: 1;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        margin: 1rem 3rem;
        color: var(--main-foreground);
      }

      .avatar {
        position: relative; /* Needed for the avatar edit button */
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

      .avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
      }

      .avatar .edit-icon {
        color: var(--main-foreground);
        background: inherit;
        position: absolute;
        bottom: 0;
        right: 0;
        border-radius: 50%;
        padding: 0.2rem; /* Add padding for better clickability */
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

      @media (max-width: 1078px) {
        activity-feed {
          flex: 0 0 0; /* Collapse the sidebar */
          pointer-events: none; /* Prevent interaction when hidden */
        }
      }

      transaction-watcher.submit {
        padding-bottom: 4rem;
        align-self: center;
      }
    `,
  ];

  @property() entity: string | undefined;

  @state() private links: { name: string; value: string }[] = [];
  @state() private uploadedImage: string | undefined;

  // Use task to get UpdraftSettings
  private readonly updraftSettingsTask = new Task(this, {
    task: async () => {
      // For now, we'll still use the context-based settings until we have a signal/task implementation
      const updraftSettingsElement = document.querySelector(
        'updraft-settings-provider'
      );
      if (updraftSettingsElement) {
        return (updraftSettingsElement as UpdraftSettingsProvider).settings;
      }
      return null;
    },
    args: () => [] as const,
  });

  @query('upd-dialog', true) updDialog!: UpdDialog;
  @query('transaction-watcher.submit', true)
  submitTransaction!: TransactionWatcher;
  @query('transaction-watcher.approve', true)
  approveTransaction!: TransactionWatcher;
  @query('sl-dialog', true) approveDialog!: SlDialog;
  @query('share-dialog', true) shareDialog!: ShareDialog;

  // Listen for user state changes
  connectedCallback() {
    super.connectedCallback();

    // Add listeners for user state events to trigger updates
    document.addEventListener(
      USER_CONNECTED_EVENT,
      this.handleUserStateChanged
    );
    document.addEventListener(
      USER_DISCONNECTED_EVENT,
      this.handleUserStateChanged
    );
    document.addEventListener(
      USER_PROFILE_UPDATED_EVENT,
      this.handleUserStateChanged
    );
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    // Remove event listeners
    document.removeEventListener(
      USER_CONNECTED_EVENT,
      this.handleUserStateChanged
    );
    document.removeEventListener(
      USER_DISCONNECTED_EVENT,
      this.handleUserStateChanged
    );
    document.removeEventListener(
      USER_PROFILE_UPDATED_EVENT,
      this.handleUserStateChanged
    );
  }

  private handleUserStateChanged = () => {
    // Force a re-render when user state changes
    this.requestUpdate();
  };

  private handleInput() {
    this.submitTransaction.reset();
  }

  private restoreLinks() {
    const savedForm = loadForm(this.form.name);
    if (savedForm) {
      this.links = Object.entries(savedForm)
        .filter(([key, value]) => key.startsWith('link') && value.trim() !== '')
        .map(([name, value]) => ({ name, value }));
    }
    this.addEmptyLink();
  }

  private addEmptyLink() {
    this.links = [
      ...this.links,
      { name: `link${this.links.length + 1}`, value: '' },
    ];
  }

  private handleLinkInput(event: InputEvent, index: number) {
    const inputElement = event.target as HTMLInputElement;
    this.links[index] = { ...this.links[index], value: inputElement.value };

    // If the user is typing into the last link input and it's not empty, add a new blank link
    if (index === this.links.length - 1 && inputElement.value.trim() !== '') {
      this.addEmptyLink();
    } else {
      this.links = [...this.links];
    }
  }

  private handleImageError(event: Event) {
    const imgElement = event.target as HTMLImageElement;
    imgElement.src = '/src/assets/icons/link-45deg.svg'; // Fallback icon
  }

  // Now handled by the user-avatar component
  // But we need to update both image and avatar fields for consistent display
  private handleAvatarChange(e: CustomEvent) {
    this.uploadedImage = e.detail.imageUrl;

    // Sync changes with the user profile to ensure consistency
    const currentProfile = userProfile.get();
    if (currentProfile) {
      const updatedProfile = {
        ...currentProfile,
        image: this.uploadedImage,
        avatar: this.uploadedImage || '', // Ensure avatar is not undefined
      };
      setUserProfile(updatedProfile);
    }
  }

  private handleFormSubmit(e: Event) {
    e.preventDefault(); // Prevent the default form submission when Enter is pressed
  }

  private async handleSubmit() {
    // Don't allow overlapping transactions
    if (this.submitTransaction.transactionTask.status !== TaskStatus.PENDING) {
      const profileData = {
        ...formToJson('edit-profile', profileSchema),
      } as CurrentUser;
      if (this.uploadedImage) {
        profileData.image = this.uploadedImage;
      }

      // Get current profile from signals
      const currentProfile = userProfile.get();

      // Update both legacy user state and new user state
      // Make sure image and avatar are both updated with the same value for consistency
      const avatarImage: string =
        this.uploadedImage ||
        currentProfile?.image ||
        currentProfile?.avatar ||
        user.get().avatar ||
        '';

      const updatedProfile: CurrentUser = {
        name: profileData.name || profileData.team || '',
        image: avatarImage,
        avatar: avatarImage, // Avatar is required and not undefined due to earlier assignment
        team: profileData.team || currentProfile?.team || user.get().team,
        about: profileData.about || currentProfile?.about || user.get().about,
        news: profileData.news || currentProfile?.news || user.get().news,
        links:
          this.links.map((link) => link.value) ||
          currentProfile?.links ||
          user.get().links,
      };

      // Update legacy user state for backward compatibility
      user.set(updatedProfile);

      // Update new user state with signals
      setUserProfile(updatedProfile);

      try {
        // Check if user is connected using the signal
        if (!isConnected.get()) {
          await this.openConnectModal();
          return;
        }

        // Get UpdraftSettings using either task or fallback to context
        const settings =
          this.updraftSettingsTask.value ||
          document.querySelector<UpdraftSettingsProvider>(
            'updraft-settings-provider'
          )?.settings;

        if (this.entity === 'idea') {
          const ideaData = formToJson('create-idea', ideaSchema);
          const ideaForm = loadForm('create-idea');
          if (ideaForm) {
            this.submitTransaction.hash = await updraft.write(
              'createIdeaWithProfile',
              [
                BigInt(defaultFunderReward),
                parseUnits(ideaForm.deposit, 18),
                toHex(JSON.stringify(ideaData)),
                toHex(JSON.stringify(profileData)),
              ]
            );
            this.shareDialog.topic = ideaData.name as string;
          }
        } else if (this.entity === 'solution') {
          // Handle solution creation with profile update
          const solutionData = formToJson('create-solution', ideaSchema);
          const solutionForm = loadForm('create-solution');
          const params = new URLSearchParams(window.location.search);
          const ideaId = params.get('ideaId');

          if (solutionForm && ideaId && settings) {
            // Format the deadline date properly
            const deadlineDate = solutionForm['deadline']
              ? dayjs(solutionForm['deadline']).unix()
              : dayjs().add(30, 'days').unix(); // Default to 30 days from now if not set

            this.submitTransaction.hash = await updraft.write(
              'createSolutionWithProfile',
              [
                ideaId,
                solutionForm['funding-token'],
                parseUnits(solutionForm['deposit'], 18),
                parseUnits(solutionForm['goal'], 18),
                deadlineDate,
                BigInt(
                  (Number(solutionForm['reward']) *
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
        if (e instanceof Error) {
          if (
            e.message?.startsWith('connection') ||
            e.message?.includes('getChainId')
          ) {
            // Open the wallet connection modal if there's a connection issue
            await this.openConnectModal();
          } else if (e.message?.includes('exceeds balance')) {
            this.updDialog.show();
          } else if (e.message?.includes('exceeds allowance')) {
            this.approveTransaction.reset();
            this.approveDialog.show();

            // Get settings for UPD token address
            const settings =
              this.updraftSettingsTask.value ||
              document.querySelector<UpdraftSettingsProvider>(
                'updraft-settings-provider'
              )?.settings;

            if (settings) {
              const upd = new Upd(settings.updAddress);
              this.approveTransaction.hash = await upd.write('approve', [
                updraft.address,
                parseUnits('1', 29),
              ]);
            }
          }
        }
      }
    }
  }

  private async handleSubmitSuccess(t: TransactionSuccess) {
    if (this.entity) {
      const address = t.receipt?.logs?.[0]?.topics?.[1];
      if (address) {
        if (this.entity === 'idea') {
          this.shareDialog.url = `${window.location.origin}/idea/${trim(address)}`;
          this.shareDialog.action = 'created an Idea';
        } else if (this.entity === 'solution') {
          const params = new URLSearchParams(window.location.search);
          const ideaId = params.get('ideaId');
          this.shareDialog.url = `${window.location.origin}/solution/${trim(address)}?ideaId=${ideaId}`;
          this.shareDialog.action = 'created a Solution';
        }
        this.shareDialog.show();
      }
    }
  }

  private async openConnectModal() {
    try {
      console.log('Opening connect modal');
      // Use connectWallet from signals
      await connectWallet();
    } catch (error) {
      console.error('Error opening connect modal:', error);
    }
  }

  private initializeFormFields() {
    console.log('Initializing form fields with user profile signal');

    // Get current profile from signals
    const currentProfile = userProfile.get();

    // Get the form elements
    const nameInput = this.shadowRoot?.querySelector(
      'sl-input[name="name"]'
    ) as HTMLInputElement;
    const teamInput = this.shadowRoot?.querySelector(
      'sl-input[name="team"]'
    ) as HTMLInputElement;
    const aboutTextarea = this.shadowRoot?.querySelector(
      'sl-textarea[name="about"]'
    ) as HTMLTextAreaElement;
    const newsTextarea = this.shadowRoot?.querySelector(
      'sl-textarea[name="news"]'
    ) as HTMLTextAreaElement;

    // Set values from signals (prioritize signal state over legacy state)
    if (nameInput) {
      nameInput.value = currentProfile?.name || user.get().name || '';
    }

    if (teamInput) {
      teamInput.value = currentProfile?.team || user.get().team || '';
    }

    if (aboutTextarea) {
      aboutTextarea.value = currentProfile?.about || user.get().about || '';
    }

    if (newsTextarea) {
      newsTextarea.value = currentProfile?.news || user.get().news || '';
    }

    // Force a re-render to ensure all form fields are updated
    this.requestUpdate();
  }

  firstUpdated(changedProperties: Map<string | number | symbol, unknown>) {
    super.firstUpdated(changedProperties);

    // Get current profile from signals
    const currentProfile = userProfile.get();

    // Initialize links from user profile data if available
    if (currentProfile?.links && Array.isArray(currentProfile.links)) {
      this.links = currentProfile.links
        .filter((link: string) => link && link.trim() !== '')
        .map((link: string, index: number) => ({
          name: `link${index + 1}`,
          value: link,
        }));
      console.log('Initialized links from user profile signal:', this.links);
    } else if (user.get().links && Array.isArray(user.get().links)) {
      // Fallback to legacy user state if needed
      const userData = user.get();
      if (userData && userData.links) {
        this.links = userData.links
          .filter((link: string) => link && link.trim() !== '')
          .map((link: string, index: number) => ({
            name: `link${index + 1}`,
            value: link,
          }));
        console.log('Initialized links from legacy user state:', this.links);
      }
    }

    // Always ensure we have at least one empty link field
    if (
      this.links.length === 0 ||
      this.links[this.links.length - 1].value.trim() !== ''
    ) {
      this.addEmptyLink();
    }

    // Restore any form data that might have been saved locally
    this.restoreLinks();

    // Initialize all form fields with user profile data
    setTimeout(() => {
      this.initializeFormFields();
    }, 0);

    // Start the task to get settings
    this.updraftSettingsTask.run();
  }

  render() {
    topBarContent.set(html` <page-heading>Edit Your Profile</page-heading>`);

    // Get current profile and address from signals
    const currentProfile = userProfile.get();
    const currentAddress = userAddress.get();

    return html`
      <div class="container">
        <main>
          <form
            name="edit-profile"
            @submit=${this.handleFormSubmit}
            @input=${this.handleInput}
          >
            <user-avatar
              .address=${currentAddress || ''}
              .imageUrl=${this.uploadedImage ||
              currentProfile?.image ||
              currentProfile?.avatar ||
              user.get().avatar ||
              ''}
              .editable=${true}
              @avatar-change=${this.handleAvatarChange}
              size="64px"
            >
              <sl-icon
                slot="edit-icon"
                src="${pencilSquare}"
                label="Edit image"
              ></sl-icon>
            </user-avatar>
            <sl-input
              name="name"
              label="Name"
              required
              autocomplete="name"
              value=${currentProfile?.name || user.get().name || ''}
            ></sl-input>
            <sl-input
              name="team"
              label="Team"
              autocomplete="organization"
              value=${currentProfile?.team || user.get().team || ''}
            ></sl-input>
            <sl-textarea
              name="about"
              label="About"
              resize="auto"
              value=${currentProfile?.about || user.get().about || ''}
            ></sl-textarea>
            <sl-textarea
              name="news"
              label="News"
              resize="auto"
              value=${currentProfile?.news || user.get().news || ''}
            ></sl-textarea>
            <div class="links-section">
              <p>Links</p>
              ${this.links.map(
                (link, index) => html`
                  <sl-input
                    class="link-input"
                    autocomplete="url"
                    name=${link.name}
                    value=${link.value}
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
                `
              )}
            </div>
            <sl-button variant="primary" @click=${this.handleSubmit}>
              Submit Profile
              ${this.entity ? 'and Create ' + capitalize(this.entity) : ''}
            </sl-button>
          </form>
          <upd-dialog></upd-dialog>
          <sl-dialog label="Set Allowance">
            <p>
              Before you can submit your profile, you need to sign a transaction
              to allow Updraft to spend your UPD tokens.
            </p>
            <transaction-watcher
              class="approve"
              @transaction-success=${this.handleSubmit}
            ></transaction-watcher>
          </sl-dialog>
          <share-dialog></share-dialog>
          <transaction-watcher
            class="submit"
            @transaction-success=${this.handleSubmitSuccess}
          ></transaction-watcher>
        </main>
        ${currentAddress
          ? html` <activity-feed
              .userId=${currentAddress}
              .userName=${currentProfile?.name || user.get().name || ''}
            ></activity-feed>`
          : ''}
      </div>
    `;
  }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

declare global {
  interface HTMLElementTagNameMap {
    'edit-profile': EditProfile;
  }
}
