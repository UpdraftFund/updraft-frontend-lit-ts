import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

@customElement('activity-feed')
export class ActivityFeed extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      background-color: #f4f4f4; /* Light gray placeholder */
      border-left: 1px dashed #46f;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      overflow: hidden;
    }

    p {
      font-size: 1rem;
      color: gray;
      text-align: left;
      margin-left: 1rem;
    }
  `;

  render() {
    return html` <p>Activity Feed Placeholder</p> `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'activity-feed': ActivityFeed;
  }
}
