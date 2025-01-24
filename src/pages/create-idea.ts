import { customElement } from "lit/decorators.js";
import { css, html } from "lit";

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import type { SlInput } from '@shoelace-style/shoelace';

import '../components/layout/top-bar'
import '../components/layout/page-heading.ts'
import '../components/layout/left-side-bar.ts'
import '../components/label-with-hint.ts'
import { SaveableForm } from "../components/base/saveable-form.ts";

@customElement('create-idea')
export class CreateIdea extends SaveableForm {

  static styles = css`
    left-side-bar {
      flex: 0 0 274px; /* Sidebar width is fixed */
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
      gap: 0.75rem;
      margin: 1.5rem 3rem;
    }

    .deposit-row {
      display: flex; 
      align-items: center;
      gap: 1rem;
      margin-top: 0.25rem;
    }

    .deposit-row > sl-input {
      flex: 1; /* Makes the input take up available space */
    }

    .deposit-row > sl-button {
      flex-shrink: 0; /* Prevents the button from shrinking */
    }

    sl-input[name="deposit"] {
      flex: 0 0 auto;
      width: calc(10ch + var(--sl-input-spacing-medium) * 2);
      box-sizing: content-box;
    }

    sl-input[name="deposit"]::part(input) {
      text-align: right;
    }

    /* Responsive behavior for smaller screens */
    @media (max-width: 768px) {
      left-side-bar {
        flex: 0 0 0; /* Collapse the sidebar */
        pointer-events: none; /* Prevent interaction when hidden */
      }

      .container {
        flex-direction: column;
      }

      form {
        margin: 1rem;
      }
    }
  `;

  private handleTagsInput(e: Event) {
    const input = e.target as SlInput;
    const value = input.value;
    const spacePositions = [...value.matchAll(/\s/g)].map(match => match.index) || [];

    if (spacePositions.length > 4) {
      const fifthSpaceIndex = spacePositions[4];
      // Trim input to the fifth space and allow a trailing space
      input.value = value.slice(0, fifthSpaceIndex + 1);
      input.style.setProperty('--sl-input-focus-ring-color', 'red');
    } else {
      input.style.removeProperty('--sl-input-focus-ring-color');
    }
  }

  render() {
    return html`
      <top-bar hide-create-idea-button>
        <page-heading>Create a new Idea</page-heading>
      </top-bar>
      <div class="container">
        <left-side-bar></left-side-bar>
        <main>
          <form name="create-idea">
            <sl-input name="name" required>
              <label-with-hint slot="label" label="Name*" hint="A short name for your idea"></label-with-hint>
            </sl-input>
            <sl-textarea name="description" resize="auto">
              <label-with-hint
                  slot="label"
                  label="Description"
                  hint="How do you want to make your community, your project or the world better?"
              </label-with-hint>
            </sl-textarea>
            <sl-input name="tags" @sl-input=${this.handleTagsInput}>
              <label-with-hint
                  slot="label"
                  label="Tags"
                  hint="Enter up to five tags separated by spaces to help people find your idea. Use hyphens for multi-word-tags.">
              </label-with-hint>
            </sl-input>
            <div class="deposit-container">
              <label-with-hint
                  label="Deposit*"
                  hint="The initial UPD tokens you will deposit. The more you deposit, the more you \
                        stand to earn from supporters of your idea. As a creator, you can always withdraw your \
                        full initial deposit minus the anti-spam fee of 1 UPD or 1% (whichever is greater).">
              </label-with-hint>
              <div class="deposit-row">
                <sl-input name="deposit" required></sl-input>
                <span>UPD</span>
                <sl-button variant="primary">Get more UPD</sl-button>
                <div>
                  <span>Anti-Spam Fee: </span>
                  <span class="fee">1</span>
                  <span>UPD</span>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    `;
  }

}

declare global {
  interface HTMLElementTagNameMap {
    'create-idea': CreateIdea;
  }
}