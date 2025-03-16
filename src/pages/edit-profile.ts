import { customElement, state, property, query } from 'lit/decorators.js';
import { css } from 'lit';
import { TaskStatus } from '@lit/task';
import { SignalWatcher, html } from '@lit-labs/signals';
import { consume } from '@lit/context';
import { parseUnits, toHex, trim } from 'viem';

import pencilSquare from '@icons/pencil-square.svg';

import { dialogStyles } from '@styles/dialog-styles';

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@layout/page-heading';
import '@/components/page-specific/profile/activity-feed';
import '@/components/shared/transaction-watcher';
import '@/components/shared/upd-dialog';
import '@/components/shared/share-dialog';
import {
  TransactionWatcher,
  TransactionSuccess,
} from '@/components/shared/transaction-watcher';
import { UpdDialog } from '@/components/shared/upd-dialog';
import { ShareDialog } from '@/components/shared/share-dialog';
import { SlDialog } from '@shoelace-style/shoelace';
import {
  SaveableForm,
  loadForm,
  formToJson,
} from '@components/base/saveable-form';

import { updraft } from '@contracts/updraft';
import { Upd } from '@contracts/upd';
import {
  user,
  updraftSettings,
  defaultFunderReward,
  connectionContext,
} from '@/context';
import { userContext, UserState } from '@/state/user-state';
import { UpdraftSettings, Connection } from '@/types';
import { modal } from '@/web3';

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

  @consume({ context: connectionContext, subscribe: true }) connection!: Connection;
  @consume({ context: updraftSettings, subscribe: true }) updraftSettings!: UpdraftSettings;
  @consume({ context: userContext, subscribe: true }) userState!: UserState;

  @query('upd-dialog', true) updDialog!: UpdDialog;
  @query('transaction-watcher.submit', true)
  submitTransaction!: TransactionWatcher;
  @query('transaction-watcher.approve', true)
  approveTransaction!: TransactionWatcher;
  @query('sl-dialog', true) approveDialog!: SlDialog;
  @query('share-dialog', true) shareDialog!: ShareDialog;

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

  private handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.uploadedImage = reader.result as string;
      };
      reader.readAsDataURL(file);
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
      } as any;
      if (this.uploadedImage) {
        profileData.image = this.uploadedImage;
      }
      user.set({
        name: profileData.name || profileData.team,
        image: this.uploadedImage || user.get().image,
        avatar: this.uploadedImage || user.get().avatar,
      });
      try {
        // Add debugging to check connection state
        console.log('Connection state:', {
          userStateConnected: this.userState?.isConnected,
          legacyConnected: this.connection?.connected,
          userStateAddress: this.userState?.address,
          legacyAddress: this.connection?.address
        });
        
        // Check if user is connected using either the new or legacy connection
        if (!this.userState?.isConnected && !this.connection?.connected) {
          console.log('User not connected, opening modal');
          await this.openConnectModal();
          return;
        }
        
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
        } else {
          console.log('Submitting profile update');
          this.submitTransaction.hash = await updraft.write('updateProfile', [
            toHex(JSON.stringify(profileData)),
          ]);
        }
      } catch (e: any) {
        console.error('Profile update error:', e);
        if (e.message?.startsWith('connection') || e.message?.includes('getChainId')) {
          // Open the wallet connection modal if there's a connection issue
          await this.openConnectModal();
        } else if (e.message?.includes('exceeds balance')) {
          this.updDialog.show();
        } else if (e.message?.includes('exceeds allowance')) {
          this.approveTransaction.reset();
          this.approveDialog.show();
          const upd = new Upd(this.updraftSettings.updAddress);
          this.approveTransaction.hash = await upd.write('approve', [
            updraft.address,
            parseUnits('1', 29),
          ]);
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
        } else {
          this.shareDialog.url = `${window.location.origin}/solution/${trim(address)}`;
          this.shareDialog.action = 'created a Solution';
        }
        this.shareDialog.show();
      }
    }
  }

  private async openConnectModal() {
    try {
      console.log('Opening connect modal');
      // Use the user state connect method if available, otherwise fall back to direct modal open
      if (this.userState?.connect) {
        await this.userState.connect();
      } else {
        await modal.open({ view: 'Connect' });
      }
    } catch (error) {
      console.error('Error opening connect modal:', error);
    }
  }

  firstUpdated(changedProperties: Map<string | number | symbol, unknown>) {
    super.firstUpdated(changedProperties);
    this.restoreLinks();
  }

  render() {
    return html`
      <page-heading>Edit Your Profile</page-heading>
      <div class="container">
        <main>
          <form
            name="edit-profile"
            @submit=${this.handleFormSubmit}
            @input=${this.handleInput}
          >
            <label class="avatar">
              <img
                src=${this.uploadedImage || user.get().avatar}
                alt="User avatar"
              />
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
            ></sl-input>
            <sl-input
              name="team"
              label="Team"
              autocomplete="organization"
            ></sl-input>
            <sl-textarea name="about" label="About" resize="auto"></sl-textarea>
            <sl-textarea name="news" label="News" resize="auto"></sl-textarea>
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
        <!-- ${this.connection.address
          ? html`<activity-feed
              .userId=${this.connection.address}
              .userName=${user.get().name}
            ></activity-feed>`
          : ''} -->
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
