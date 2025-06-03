import { customElement, property } from 'lit/decorators.js';
import { html, css } from 'lit';
import { Subscription } from 'wonka';

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@layout/page-heading';
import '@components/common/label-with-hint';
import '@components/common/formatted-text-input';
import { SaveableForm } from '@components/common/saveable-form';

import layout from '@state/layout';
import { createSolutionHeading } from '@utils/create-solution/create-solution-heading';

@customElement('create-solution')
export class CreateSolution extends SaveableForm {
  @property() ideaId!: string;

  // Add a property to track the subscription
  private unsubHeading?: Subscription;

  static styles = css`
    form {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      max-width: 70rem;
      margin: 1.5rem 3rem;
    }

    sl-button {
      max-width: fit-content;
    }

    /* Responsive behavior for smaller screens */
    @media (max-width: 768px) {
      form {
        margin: 1rem;
      }
    }
  `;

  private handleFormSubmit(e: Event) {
    e.preventDefault(); // Prevent the default form submission when Enter is pressed
  }

  private nextButtonClick(e: MouseEvent) {
    const form = this.form;
    if (!form.checkValidity()) {
      e.preventDefault(); // If the form is invalid, prevent the click
      form.reportValidity(); // Show validation messages
      return;
    }
  }

  connectedCallback() {
    super.connectedCallback();
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(false);
    layout.rightSidebarContent.set(html``);
    this.unsubHeading = createSolutionHeading(this.ideaId);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubHeading) {
      this.unsubHeading.unsubscribe();
    }
  }

  render() {
    return html`
      <form name="create-solution" @submit=${this.handleFormSubmit}>
        <sl-input name="name" required autocomplete="off">
          <label-with-hint
            slot="label"
            label="Name*"
            hint="A short name for your solution"
          ></label-with-hint>
        </sl-input>

        <formatted-text-input name="description" required>
          <label-with-hint
            slot="label"
            label="Description*"
            hint="A description of your solution. You can paste formatted text."
          ></label-with-hint>
        </formatted-text-input>

        <input type="hidden" name="ideaId" value="${this.ideaId}" />

        <sl-button
          href="/create-solution-two/${this.ideaId}"
          variant="primary"
          @click=${this.nextButtonClick}
          >Next: Funding Details
        </sl-button>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'create-solution': CreateSolution;
  }
}
