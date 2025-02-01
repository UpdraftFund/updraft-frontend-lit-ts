import { customElement, state } from "lit/decorators.js";
import { css, html } from "lit";
import { consume } from "@lit/context";

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

import '../components/layout/top-bar'
import '../components/layout/page-heading.ts'
import '../components/layout/left-side-bar.ts'
import '../components/layout/activity-feed.ts'
import { SaveableForm } from "../components/base/saveable-form.ts";

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

  private restoreLinks() {
    const savedForm = localStorage.getItem(`form:${this.form.name}`);
    if (savedForm) {
      this.links = Object.entries(JSON.parse(savedForm) as Record<string, string>)
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