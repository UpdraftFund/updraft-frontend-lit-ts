import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

import '@layout/top-bar';
import '@layout/left-side-bar';
import '@layout/right-side-bar';
import '@components/search-bar';
import '@components/page-specific/home/tracked-changes';
import '@components/page-specific/home/beginner-tasks';

@customElement('home-page')
export class HomePage extends LitElement {
  static styles = css`
    search-bar {
      margin: 0 auto;
    }

    .container {
      display: flex;
      flex: 1;
      overflow: hidden;
      background: linear-gradient(
        to bottom,
        var(--subtle-background),
        var(--main-background)
      );
    }

    left-side-bar {
      flex: 0 0 300px;
    }

    main {
      flex: 1;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      padding: 0.5rem 1rem;
      color: var(--main-foreground);
      border-radius: 25px 25px 0 0;
      background: var(--main-background);
    }

    right-side-bar {
      flex: 0 0 300px;
      border-radius: 0 0 0 25px;
      background: var(--subtle-background);
    }
  `;

  render() {
    return html`
      <top-bar><search-bar></search-bar></top-bar>
      <div class="container">
        <left-side-bar location="home"></left-side-bar>
        <main>
          <tracked-changes></tracked-changes>
          <beginner-tasks></beginner-tasks>
        </main>
        <right-side-bar show-hot-ideas></right-side-bar>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
