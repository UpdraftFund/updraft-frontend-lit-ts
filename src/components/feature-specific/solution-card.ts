import { css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { LitComponent } from "../litComponent";



@customElement('app-solution-card')
export class AppSolutionCard extends LitComponent {
  @property()
  title = '';

  @property()
  ideaTitle = '';

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

    .solution-card {
      border-radius: 12px;
      padding: 24px;
      background-color: var(--radishical-100);
      display: flex;
      flex-direction: column;
    }

    .solution-card-title {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
    }

    .solution-card-title-text {
      font-size: 20px;
      font-weight: bold;
      color: var(--mako-1000);
      line-clamp: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .solution-card-idea-title {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 4px;
    }

    .solution-card-idea-title-text {
      font-size: 14px;
      color: var(--mako-700);
      line-clamp: 1; 
      min-width: fit-content;
    }

    .solution-card-idea-title-idea {
      font-size: 14px;
      color: var(--mako-900);
      font-weight: 600;
      line-clamp: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-decoration: underline;
    }

    .solution-card-description {
      font-size: 16px;
      color: var(--mako-900);
      line-clamp: 2;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      margin-bottom: 4px;
    }

    .solution-card-create-info {
      display: flex;
      align-items: center;
      gap: 4px;
      justify-content: space-between;
      margin-bottom: 32px;
    }
    
    .solution-card-created-by {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .solution-card-created-by-title {
      font-size: 14px;
      color: var(--mako-700);
    }

    .solution-card-created-by-name {
      font-size: 14px;
      color: var(--mako-900);
      font-weight: 600;
    }

    .solution-card-created-at {
      font-size: 14px;
      color: var(--mako-900);
    }

    .solution-card-support-progress {
      display: flex;
      flex-direction: column;
      width: 100%;
      gap: 4px;
    }

    .solution-card-support-progress-staked {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .solution-card-support-progress-staked-info {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .solution-card-support-progress-staked-amount {
      font-size: 16px;
      color: var(--mako-900);
      font-weight: 600;
    }

    .solution-card-support-progress-staked-title {
      font-size: 16px;
      color: var(--mako-700);
    }

    .solution-card-support-progress-support-bolt {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .solution-card-support-progress-support-bolt-count {
      font-size: 20px;
      color: var(--mako-1000);
      font-weight: 700;
    }

    .solution-card-support-progress-stats {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .solution-card-support-progress-stats-support-portion {
      display: flex;
      align-items: center;
      gap: 4px;
      width: fit-content;
    }

    .solution-card-support-progress-stats-support-portion-amount {
      font-size: 20px;
      color: var(--radishical-800);
      font-weight: 600;
    }

    .solution-card-support-progress-stats-support-portion-total {
      font-size: 20px;
      color: var(--mako-900);
      font-weight: 600;
    }

    .solution-card-support-progress-stats-time-left {
      display: flex;
      align-items: center;
      gap: 4px;
      width: fit-content;
    }

    .solution-card-support-progress-stats-time-left-text {
      font-size: 20px;
      color: var(--mako-900);
      font-weight: 600; 
      word-spacing: -2px;
    }

    .solution-card-support-progress-bar {
      width: 100%;
      height: 20px;
      background-color: var(--radishical-200);
      border-radius: 4px;
      position: relative;
      margin-bottom: 16px;
    }

    .solution-card-support-progress-bar-fill {
      background-color: var(--radishical-700);
      border-radius: 4px;
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
    }

    .separator {
      width: 100%;
      height: 1px;
      background-color: var(--radishical-300);
      margin-bottom: 16px;
    }

    .solution-card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .solution-card-creator {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .solution-card-creator-udp-amount {
      font-size: 14px;
      color: var(--mako-900);
      font-weight: 600;
    }

    .solution-card-earned {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .solution-card-earned-title {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--mako-700);
    }

    .solution-card-earned-amount {
      font-size: 16px;
      color: var(--mako-900);
      font-weight: 700;
    }

  `;

  render() {
    return html`
      <div class="solution-card">
        <div class="solution-card-title">
          <app-icon name="lightbulb" width="25px" height="25px" style="margin-top: -4px;"></app-icon>
          <p class="solution-card-title-text">${this.title}</p>
        </div>
        
        <div class="solution-card-idea-title">
          <p class="solution-card-idea-title-text">Solution for</p>
          <p class="solution-card-idea-title-idea">${this.ideaTitle}</p>
        </div>

        <p class="solution-card-description">${this.description}</p>

        <div class="solution-card-create-info">
          <div class="solution-card-created-by">
            <p class="solution-card-created-by-title">Created by</p>
            <p class="solution-card-created-by-name">${this.createdBy}</p>
          </div>
          
          <p class="solution-card-created-at">${this.createdAt}</p>
        </div>

        <div class="solution-card-support-progress">
          <div class="solution-card-support-progress-staked">
            <div class="solution-card-support-progress-staked-info">
              <p class="solution-card-support-progress-staked-amount">${this.supportUPDAmount}K UDP</p>
              <p class="solution-card-support-progress-staked-title">Staked</p>
            </div>

            <div class="solution-card-support-progress-support-bolt">
              <app-icon name="bolt" width="20px" height="20px"></app-icon>
              <p class="solution-card-support-progress-support-bolt-count">125</p>
            </div>
          </div>
        </div>

        <div class="solution-card-support-progress-stats">
          <div class="solution-card-support-progress-stats-support-portion">
            <p class="solution-card-support-progress-stats-support-portion-amount">7.4K</p>
            <p class="solution-card-support-progress-stats-support-portion-total"> / 10.2K UDP</p>
          </div>

          <div class="solution-card-support-progress-stats-time-left">
            <app-icon name="hourglass-clock" width="20px" height="20px"></app-icon>
            <p class="solution-card-support-progress-stats-time-left-text">23d 12h 34m</p>
          </div>
        </div>
        
        <div class="solution-card-support-progress-bar">
          <div class="solution-card-support-progress-bar-fill" style="width: ${34}%"></div>
        </div>

        <span class="separator"></span>

        <div class="solution-card-footer">
          <div class="solution-card-creator">
            <app-tag variant="golden">Drafter</app-tag>
            <p class="solution-card-creator-udp-amount">240 UPD (3.2% of Total shares)</p>
          </div>

          <div class="solution-card-earned">  
            <div class="solution-card-earned-title">
              <app-icon name="coins" width="15px" height="15px"></app-icon>
              <p class="solution-card-earned-text">Earned</p>
            </div>
            <p class="solution-card-earned-amount">7.342 UPD</p>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-solution-card': AppSolutionCard;
  }
}