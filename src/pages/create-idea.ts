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