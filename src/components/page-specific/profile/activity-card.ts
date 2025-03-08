import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { formatDistanceToNow } from 'date-fns';
import { formatUnits } from 'viem';

// Import Shoelace components
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/progress-bar/progress-bar.js';
import '@shoelace-style/shoelace/dist/components/badge/badge.js';
import '@shoelace-style/shoelace/dist/components/divider/divider.js';

// Define the activity type to ensure type safety
type ActivityType = {
  type: 'ideaFunded' | 'solutionFunded' | 'solutionDrafted';
  contribution?: number;
  idea?: {
    id: string;
    name: string;
    creator: { id: string };
    description?: string | null;
  };
  solution?: {
    id: string;
    name?: string;
    description?: string | null;
  };
  name?: string;
  userName?: string;
  displayName?: string;
  description?: string | null;
  time: string;
  deadline?: string;
  fundingGoal?: string;
  tokensContributed?: string;
  stake?: string;
  funderReward?: string;
};

@customElement('activity-card')
export class ActivityCard extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
    }

    sl-card {
      --padding: 1rem;
      width: 100%;
    }

    .action-time {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      margin-bottom: 0.5rem;
    }

    .action {
      font-family: 'Inter', sans-serif;
      font-weight: 500;
      font-size: 1.125rem;
      line-height: 1.44em;
      color: var(--sl-color-neutral-900);
    }

    .time {
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      color: var(--sl-color-neutral-600);
    }

    .name {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      font-size: 1.25rem;
      line-height: 1.2em;
      color: var(--sl-color-neutral-900);
      margin-bottom: 0.75rem;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .name-link {
      text-decoration: none;
      color: var(--sl-color-neutral-900);
    }

    .name-link:hover {
      text-decoration: underline;
      color: var(--accent);
    }

    .description-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      width: 100%;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .description {
      font-family: 'Inter', sans-serif;
      font-size: 0.875rem;
      line-height: 1.5em;
      color: var(--sl-color-neutral-700);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }

    .details-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .goal {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 150px;
    }

    .goal-text {
      font-size: 0.75rem;
      color: var(--sl-color-neutral-600);
    }

    sl-badge {
      --sl-font-size-x-small: 0.75rem;
    }

    .emoji-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
    }

    .emoji {
      font-size: 1rem;
    }
  `;

  @property() activity!: ActivityType;

  render() {
    return html`
      <sl-card>
        <div class="action-time">
          <div class="action">
            ${this.getActivityIcon()} ${this.getActivityAction()}
          </div>
          <div class="time">${this.formatTime()}</div>
        </div>

        <div class="name">${this.renderNameWithLink()}</div>

        <div class="description-container">
          <div class="description">${this.getDescription()}</div>
          <sl-button
            variant="primary"
            size="small"
            href="${this.getButtonLink()}"
            >${this.getFundButtonText()}</sl-button
          >
        </div>

        <sl-divider></sl-divider>

        ${this.renderDetailsBar()}
      </sl-card>
    `;
  }

  private getActivityIcon() {
    switch (this.activity.type) {
      case 'ideaFunded':
        return '🪁';
      case 'solutionFunded':
        return '💸';
      case 'solutionDrafted':
        return '📜';
      default:
        return '📝';
    }
  }

  private getActivityAction() {
    // In a real app, you would get the user's name from a profile service
    const userName = this.activity.userName;

    switch (this.activity.type) {
      case 'ideaFunded':
        return `${userName} supported an Idea with ${formatUnits(
          BigInt(this.activity.contribution || 0),
          18
        )} UPD`;
      case 'solutionFunded':
        return `${userName} funded a solution with ${formatUnits(
          BigInt(this.activity.contribution || 0),
          18
        )} UPD`;
      case 'solutionDrafted':
        return `${userName} drafted a solution`;
      default:
        return 'Unknown Activity';
    }
  }

  private renderNameWithLink() {
    const name = this.getName();

    if (this.activity.type === 'ideaFunded' && this.activity.idea?.name) {
      // Extract idea ID from the activity data
      const ideaId = this.getIdeaId();
      if (ideaId) {
        return html`<a href="/idea/${ideaId}" class="name-link">${name}</a>`;
      }
    } else if (
      (this.activity.type === 'solutionFunded' ||
        this.activity.type === 'solutionDrafted') &&
      this.activity.solution?.name
    ) {
      // Extract solution ID from the activity data
      const solutionId = this.getSolutionId();
      if (solutionId) {
        return html`<a href="/solution/${solutionId}" class="name-link"
          >${name}</a
        >`;
      }
    }

    return name;
  }

  private getIdeaId() {
    return this.activity.idea?.id || '';
  }

  private getSolutionId() {
    return this.activity.solution?.id || '';
  }

  private getName() {
    return (
      this.activity.name ||
      this.activity.displayName ||
      this.activity.idea?.name ||
      this.activity.solution?.name ||
      'Unnamed'
    );
  }

  private getDescription() {
    return (
      this.activity.description ||
      this.activity.idea?.description ||
      this.activity.solution?.description ||
      ''
    );
  }

  private getFundButtonText() {
    switch (this.activity.type) {
      case 'ideaFunded':
        return 'Support this Idea';
      case 'solutionFunded':
      case 'solutionDrafted':
        return 'Fund this Solution';
      default:
        return 'Support';
    }
  }

  private renderDetailsBar() {
    if (this.activity.type === 'ideaFunded') {
      return html`
        <div class="details-bar">
          <span class="emoji-badge"
            ><span class="emoji">🌱</span> Created
            ${this.formatCreatedTime()}</span
          >
          <span class="emoji-badge"
            ><span class="emoji">💰</span> ${this.activity.funderReward ||
            '10'}%
            Funder Reward</span
          >
          <span class="emoji-badge"><span class="emoji">🔥</span> 78.8k</span>
        </div>
      `;
    } else {
      // For solution types
      const progress = this.calculateProgress();
      const isCompleted = progress >= 100;

      return html`
        <div class="details-bar">
          <div class="goal">
            <sl-progress-bar
              value="${Math.min(progress, 100)}"
            ></sl-progress-bar>
            <div class="goal-text">
              ${this.activity.tokensContributed || '0'} out of
              ${this.activity.fundingGoal || '150,000'} UPD
            </div>
          </div>
          ${isCompleted
            ? html`<sl-badge variant="success" pill
                ><span class="emoji">🥳</span> Funded</sl-badge
              >`
            : ''}
          <span class="emoji-badge"
            ><span class="emoji">⏰</span> ${this.formatDeadline()}</span
          >
          <span class="emoji-badge"
            ><span class="emoji">🌱</span> ${this.formatCreatedTime()}</span
          >
          <span class="emoji-badge"
            ><span class="emoji">💎</span> ${this.activity.stake ||
            '200K'}</span
          >
          <span class="emoji-badge"
            ><span class="emoji">💰</span> ${this.activity.funderReward ||
            '10'}%</span
          >
        </div>
      `;
    }
  }

  private calculateProgress() {
    if (!this.activity.tokensContributed || !this.activity.fundingGoal) {
      return 0;
    }

    const contributed = parseFloat(
      String(this.activity.tokensContributed).replace(/,/g, '')
    );
    const goal = parseFloat(
      String(this.activity.fundingGoal).replace(/,/g, '')
    );

    if (isNaN(contributed) || isNaN(goal) || goal === 0) {
      return 0;
    }

    return (contributed / goal) * 100;
  }

  private formatTime() {
    try {
      const date = new Date(this.activity.time);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return '15 minutes ago'; // Fallback
    }
  }

  private formatCreatedTime() {
    try {
      const date = new Date(this.activity.time);
      return formatDistanceToNow(date, { addSuffix: false });
    } catch (e) {
      return '3 days ago'; // Fallback
    }
  }

  private formatDeadline() {
    if (!this.activity.deadline) {
      return 'in 2 days';
    }

    try {
      const deadline = new Date(this.activity.deadline);
      const now = new Date();

      if (deadline < now) {
        return 'expired';
      }

      return `in ${formatDistanceToNow(deadline, { addSuffix: false })}`;
    } catch (e) {
      return 'in 2 days'; // Fallback
    }
  }

  private getButtonLink() {
    if (this.activity.type === 'ideaFunded') {
      const ideaId = this.getIdeaId();
      return ideaId ? `/idea/${ideaId}` : '';
    } else if (
      this.activity.type === 'solutionFunded' ||
      this.activity.type === 'solutionDrafted'
    ) {
      const solutionId = this.getSolutionId();
      return solutionId ? `/solution/${solutionId}` : '';
    }
    return '';
  }
}
