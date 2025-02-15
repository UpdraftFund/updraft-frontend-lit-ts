import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

import '@layout/top-bar';
import '@layout/left-side-bar';

@customElement('discover-page')
export class DiscoverPage extends LitElement {

  static styles = css`
    .container {
      display: flex;
      flex: 1 1 auto;
      overflow: hidden;
    }

    left-side-bar {
      flex: 0 0 274px;
    }

    main {
      flex: 1;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: .2rem;
      padding: .5rem 1rem;
      color: var(--main-foreground);
      background: var(--main-background);
    }
  `;

  render() {
    return html`
      <top-bar></top-bar>
      <div class="container">
        <left-side-bar location="discover"></left-side-bar>
        <main></main>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'discover-page': DiscoverPage;
  }
}
