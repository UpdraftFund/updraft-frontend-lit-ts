import { customElement, property } from 'lit/decorators.js';
import { html, css } from 'lit';

import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/textarea/textarea.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import { SaveableForm } from '@components/common/saveable-form';

import layout from '@state/layout';

import '@layout/page-heading';
import '@components/common/label-with-hint';

import { IdeaDocument } from '@gql';
import urqlClient from '@utils/urql-client';

@customElement('create-solution')
export class CreateSolution extends SaveableForm {
  @property() ideaId!: string;

  static styles = css`
    :host {
      width: 100%;
      overflow: hidden;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 1.2rem;
      margin: 1.5rem 3rem;
    }

    sl-input,
    sl-textarea {
      width: 100%;
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

  private readonly addIdeaToHeading = async () => {
    const result = await urqlClient.query(IdeaDocument, {
      ideaId: this.ideaId,
    });
    const ideaData = result.data?.idea;
    if (ideaData) {
      layout.topBarContent.set(html`
        <page-heading
          >Create a new Solution
          <a href="/idea/${this.ideaId}">for ${ideaData.name}</a>
        </page-heading>
      `);
    }
  };

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

  firstUpdated(changedProperties: Map<string | number | symbol, unknown>) {
    super.firstUpdated(changedProperties);
    this.addIdeaToHeading();
  }

  constructor() {
    super();
    layout.topBarContent.set(html`
      <page-heading>Create a new Solution</page-heading>
    `);
    layout.showLeftSidebar.set(true);
    layout.showRightSidebar.set(false);
    layout.rightSidebarContent.set(html``);
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

        <sl-textarea name="description" required resize="auto">
          <label-with-hint
            slot="label"
            label="Description*"
            hint="A description of your solution"
          ></label-with-hint>
        </sl-textarea>

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
