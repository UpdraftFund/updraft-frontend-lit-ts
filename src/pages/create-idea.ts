import { customElement } from "lit/decorators.js";
import { css, html, LitElement } from "lit";

import '../components/layout/top-bar'
import '../components/layout/left-side-bar.ts'

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
      font-family: Arial, sans-serif;
    }

    label {
      font-size: 1rem;
      font-weight: bold;
      display: block;
      margin-bottom: 0.2rem;
    }

    .hint {
      font-size: 0.875rem;
      color: gray;
      margin-bottom: 0.5rem;
    }

    input[name="name"] {
      width: 100%;
      padding: 0.5rem;
      font-size: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-sizing: border-box;
    }

    input[name="name"]:required {
      border-color: var(--main-foreground);
    }
  `;

  render() {
    return html`
      <top-bar hide-create-idea-button><span>Create a new Idea</span></top-bar>
      <div class="container">
        <left-side-bar></left-side-bar>
        <main>
          <form>
            <label for="name">Name</label>
            <div class="hint">A short name for your idea</div>
            <input type="text" id="name" name="name" required/>
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