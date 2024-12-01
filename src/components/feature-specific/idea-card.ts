import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { LitComponent } from '../litComponent';

@customElement('app-idea-card')
export class AppIdeaCard extends LitComponent {

  @property()
  title = '';

  @property()
  description = '';

  @property()
  createdBy = '';

  @property()
  createdAt = '';

  @property({ type: Number })
  supportUPDAmount = 0;

  static styles = css`
    :host {
      display: inline-block;
    }

    .idea-card {
      border-radius: 12px;
      padding: 24px;
      background-color: var(--river-blue-200);
      display: flex;
      flex-direction: column;
    }

    .idea-card-title {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
    }

    .idea-card-title-text {
      font-size: 20px;
      font-weight: bold;
      color: var(--mako-1000);
      line-clamp: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .idea-card-description {
      font-size: 16px;
      color: var(--mako-900);
      line-clamp: 2;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      margin-bottom: 4px;
    }

    .idea-card-create-info {
      display: flex;
      align-items: center;
      gap: 4px;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    
    .idea-card-created-by {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .idea-card-created-by-title {
      font-size: 14px;
      color: var(--mako-700);
    }

    .idea-card-created-by-name {
      font-size: 14px;
      color: var(--mako-900);
      font-weight: 600;
    }

    .idea-card-created-at {
      font-size: 14px;
      color: var(--mako-900);
    }

    .idea-card-support-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .idea-card-support-info-supported-by {
      display: flex;
      align-items: center;
      gap: 2px;
    }

    .idea-card-support-info-supported-by-title {
      color: var(--mako-700);
    }

    .idea-card-support-info-support-bolt {
      display: flex;
      align-items: center;
      gap: 2px;

      margin-bottom: 8px;
    }

    .idea-card-support-info-support-bolt-count {
      font-size: 20px;
      color: var(--mako-1000);
      font-weight: 600;
    }

    .idea-card-support-info-supported-by-name {
      color: var(--mako-900);
      font-weight: 600;
    }

    .separator {
      height: 1px;
      width: 100%;
      background-color: var(--river-blue-300);
      margin-bottom: 16px;
    }

    .idea-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .idea-card-creator {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .idea-card-creator-udp-amount {
      font-size: 16px;
      color: var(--mako-900);
      font-weight: 600;
    }

    .idea-earned-info {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .idea-earned-info-text {
      font-size: 16px;
      color: var(--mako-700);
    }

    .idea-earned-info-amount {
      font-size: 16px;
      color: var(--mako-900);
      font-weight: 600;
    }
  `;

  render() {
    return html`
      <div class="idea-card">
        <div class="idea-card-title">
          <app-icon name="thought-bubble"></app-icon>
          <p class="idea-card-title-text">${this.title}</p>
        </div>
        
        <p class="idea-card-description">${this.description}</p>

        <div class="idea-card-create-info">
          <div class="idea-card-created-by">
            <p class="idea-card-created-by-title">Created by</p>
            <p class="idea-card-created-by-name">${this.createdBy}</p>
          </div>
          
          <p class="idea-card-created-at">${this.createdAt}</p>
        </div>

        <div class="idea-card-support-info">
          <div class="idea-card-support-info-supported-by">
            <p class="idea-card-support-info-supported-by-title">Supported by</p>
            <p class="idea-card-support-info-supported-by-name">${this.supportUPDAmount}K UDP</p>
          </div>

          <div class="idea-card-support-info-support-bolt">
            <app-icon name="bolt" width="20px" height="20px"></app-icon>
            <p class="idea-card-support-info-support-bolt-count">125</p>
          </div>
        </div>

        <span class="separator"></span>

        <div class="idea-card-footer">
          <div class="idea-card-creator">
            <app-tag variant="blue">Supporter</app-tag>
            <p class="idea-card-creator-udp-amount">240 UDP</p>
          </div>

          <div class="idea-earned-info">
            <app-icon name="coins" width="15px" height="15px"></app-icon>
            <p class="idea-earned-info-text">Earned</p>
            <p class="idea-earned-info-amount">7.342 UDP</p>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-idea-card': AppIdeaCard;
  }
}