import { customElement } from "lit/decorators.js";
import { css, html, LitElement } from "lit";

import '@shoelace-style/shoelace/dist/components/input/input.js';

import '../components/layout/top-bar'
import '../components/layout/page-heading.ts'
import '../components/layout/left-side-bar.ts'
import '../components/label-with-hint.ts'

@customElement('create-idea')
export class CreateIdea extends LitElement {

  static styles = css`
    .container {
      display: flex;
      flex: 1 1 auto; /* The container takes the remaining available space */
      overflow: hidden;
    }

    left-side-bar {
      flex: 0 0 275px; /* Sidebar width is fixed at 275px */
      height: 100%;
    }

    main {
      flex: 1;
      padding: 1rem;
      box-sizing: border-box;
    }

    form {
      max-width: 400px;
      margin: 20px auto;
    }
  `;

  render() {
    return html`
      <top-bar hide-create-idea-button><page-heading>Create a new Idea</page-heading></top-bar>
      <div class="container">
        <left-side-bar></left-side-bar>
        <main>
          <form>
            <sl-input name="name" pill required>
              <label-with-hint slot="label" label="Name*" hint="A short name for your idea"></label-with-hint>
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