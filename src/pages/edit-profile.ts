import { customElement, state } from "lit/decorators.js";
import { css, html } from "lit";
import { consume } from "@lit/context";

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

import pencilSquare from '../assets/icons/pencil-square.svg';

import '../components/layout/top-bar'
import '../components/layout/page-heading.ts'
import '../components/layout/left-side-bar.ts'
import '../components/layout/activity-feed.ts'
import { SaveableForm, loadForm } from "../components/base/saveable-form.ts";

import { User, userContext } from '../context';

@customElement('edit-profile')
export class EditProfile extends SaveableForm {
  static styles = css`
    left-side-bar {
      flex: 0 0 274px; /* Sidebar width is fixed */
    }
    
    activity-feed {
      flex: 0 0 789px; /* Activity feed width is fixed */
    }

    .container {
      display: flex;
      flex: 1 1 auto; /* The container takes the remaining available space */
      overflow: hidden;
    }

    main {
      flex: 1;
      box-sizing: border-box;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      margin: 1.5rem 3rem;
      color: var(--main-foreground);
    }

    .avatar {
      position: relative; /* Needed for the avatar edit button */
      display: inline-block; /* Shrinks the div to fit the content (image) */
      width: 64px; /* width of the image */
      height: 64px; /* height of the image */
    }

    .avatar img {
      width: 100%; /* Ensures the image fits exactly into the container */
      height: 100%; /* Matches the height of the container */
      border-radius: 50%;
      background: var(--sl-color-neutral-200); /* Background color for placeholder */
    }

    .avatar-edit {
      position: absolute;
      bottom: -5px;
      right: -5px;
      background: var(--main-background);
      border-radius: 50%;
      padding: 0.2rem; /* Add padding for better clickability */
      cursor: pointer;
      display: flex;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }
    
    .avatar-edit:hover {
      background: var(--sl-color-primary-400);
    }

    .avatar-edit sl-icon {
      color: var(--main-foreground);
      background: var(--main-background);
    }
    
    .avatar-edit input {
      display: none; /* Hide the file input */
    }

    .links-section p {
      margin: 0;
    }
    
    .links-section .link-input {
      margin-top: 0.5rem;
    }
    
    @media (max-width: 1415px) {
      left-side-bar {
        flex: 0 0 0; /* Collapse the sidebar */
        pointer-events: none; /* Prevent interaction when hidden */
      }

      form {
        margin: 1rem;
      }
    }

    @media (max-width: 1078px) {
      activity-feed {
        flex: 0 0 0; /* Collapse the sidebar */
        pointer-events: none; /* Prevent interaction when hidden */
      }
    }
  `;

  @consume({ context: userContext, subscribe: true }) user!: User;

  @state() private links: { name: string; value: string }[] = [];

  @state() private uploadedImage: string | null = null;

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
    this.links = [...this.links, { name: `link${this.links.length + 1}`, value: '' }];
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

  firstUpdated(changedProperties: Map<string | number | symbol, unknown>) {
    super.firstUpdated(changedProperties);
    this.restoreLinks();
  }

  render() {
    return html`
      <top-bar>
        <page-heading>Edit Your Profile</page-heading>
      </top-bar>
      <div class="container">
        <left-side-bar></left-side-bar>
        <main>
          <form name="edit-profile" @submit=${this.handleFormSubmit}>
            <div class="avatar">
              <img src=${this.uploadedImage || this.user.avatar || '/src/assets/icons/person-circle.svg'} alt="Avatar">
              <label class="avatar-edit">
                <input type="file" accept="image/*" @change=${this.handleImageUpload}>
                <sl-icon src="${pencilSquare}" label="Edit image"></sl-icon>
              </label>
            </div>
            <sl-input name="name" label="Name" required autocomplete="name"></sl-input>
            <sl-input name="team" label="Team" autocomplete="organization"></sl-input>
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
            <sl-button variant="primary">Submit your Profile</sl-button>
          </form>
        </main>
        <activity-feed></activity-feed>
      </div>
    `
  }

}