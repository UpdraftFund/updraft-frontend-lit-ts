import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { LitComponent } from './litComponent';

@customElement('demo-wrapper')
export class DemoWrapper extends LitComponent {
  @property()
  title = '';

  @property()
  description = '';

  static styles = css`
    :host {
      display: block;
      margin: 1rem 0;
      padding: 1rem;
      border: 1px solid #ddd;
      background: #f5f5f5;
      border-radius: 4px;
    }

    .title {
      font-size: 1.2rem;
      font-weight: bold;
      margin-bottom: 0.5rem;
    }

    .description {
      color: #666;
      margin-bottom: 1rem;
    }

    .demo-content {
      padding: 1rem;
      background: #ffffff;
      border-radius: 4px;
      border: 1px solid #f1f1f1;
    }
  `;

  render() {
    return html`
      <div class="title">${this.title}</div>
      ${this.description ? html`<div class="description">${this.description}</div>` : ''}
      <div class="demo-content">
        <slot></slot>
      </div>
    `;
  }
} 