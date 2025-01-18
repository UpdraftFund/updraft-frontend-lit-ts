import { customElement } from "lit/decorators.js";
import { css, html, LitElement } from "lit";

import '@shoelace-style/shoelace/dist/components/input/input.js';

import '../components/layout/top-bar'
import '../components/layout/left-side-bar.ts'
import '../components/label-with-hint.ts'

@customElement('create-idea')
export class CreateIdea extends LitElement {

  static styles = css`
    top-bar span{
      font-size: 2.25rem;
      font-weight: 600;
      margin-left: clamp(0px, calc((100vw - 670px) * 0.5), 266px);
      white-space: nowrap;
      color: var(--main-foreground);
    }

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
      <top-bar hide-create-idea-button><span>Create a new Idea</span></top-bar>
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