import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

import '@components/page-specific/home/tracked-changes';
import '@components/page-specific/home/beginner-tasks';

@customElement('home-page')
export class HomePage extends LitElement {
  static styles = css`
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
  `;

  render() {
    return html`
      <div class="container">
        <main>
          <tracked-changes></tracked-changes>
          <beginner-tasks></beginner-tasks>
        </main>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
