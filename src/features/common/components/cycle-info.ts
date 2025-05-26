import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { SignalWatcher } from '@lit-labs/signals';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

// Initialize dayjs plugins
dayjs.extend(relativeTime);
dayjs.extend(duration);

/**
 * Component to display cycle information for ideas and solutions
 * 
 * @element cycle-info
 * @prop {bigint} cycleLength - Length of a cycle in seconds
 * @prop {bigint} startTime - Start time of the entity (idea/solution) in seconds
 * @prop {bigint} [currentCycle] - Current cycle number (optional)
 */
@customElement('cycle-info')
export class CycleInfo extends SignalWatcher(LitElement) {
  static styles = css`
    :host {
      display: block;
    }
    
    .cycle-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
      background-color: var(--sl-color-neutral-100);
      border-radius: 8px;
      border-left: 3px solid var(--sl-color-primary-500);
    }
    
    .cycle-number {
      font-weight: 600;
      color: var(--sl-color-primary-700);
    }
    
    .time-left {
      font-size: 0.9rem;
      color: var(--sl-color-neutral-700);
    }
    
    .progress-container {
      margin-top: 0.25rem;
    }
    
    .progress-bar {
      --height: 6px;
      --indicator-color: var(--sl-color-primary-600);
      --track-color: var(--sl-color-neutral-300);
      margin-top: 0.25rem;
    }
  `;

  @property({ type: BigInt }) cycleLength = 0n;
  @property({ type: BigInt }) startTime = 0n;
  @property({ type: BigInt }) currentCycle?: bigint;

  /**
   * Calculate the current cycle number based on start time and cycle length
   */
  private calculateCurrentCycle(): bigint {
    if (this.startTime === 0n || this.cycleLength === 0n) return 0n;
    
    const now = BigInt(Math.floor(Date.now() / 1000));
    const elapsedTime = now - this.startTime;
    
    if (elapsedTime <= 0n) return 0n;
    
    return elapsedTime / this.cycleLength;
  }

  /**
   * Calculate time left in the current cycle
   */
  private calculateTimeLeft(): { timeLeft: number; percentage: number } {
    if (this.startTime === 0n || this.cycleLength === 0n) {
      return { timeLeft: 0, percentage: 0 };
    }
    
    const now = Math.floor(Date.now() / 1000);
    const cycle = this.currentCycle ?? this.calculateCurrentCycle();
    const cycleStartTime = Number(this.startTime) + Number(cycle * this.cycleLength);
    const cycleEndTime = cycleStartTime + Number(this.cycleLength);
    
    const timeLeft = Math.max(0, cycleEndTime - now);
    const elapsed = now - cycleStartTime;
    const percentage = Math.min(100, Math.max(0, (elapsed / Number(this.cycleLength)) * 100));
    
    return { timeLeft, percentage };
  }

  /**
   * Format the time left in a human-readable format
   */
  private formatTimeLeft(seconds: number): string {
    if (seconds <= 0) return 'Cycle ended';
    
    const duration = dayjs.duration(seconds, 'seconds');
    
    if (duration.asDays() >= 1) {
      return `${Math.floor(duration.asDays())}d ${duration.hours()}h remaining`;
    } else if (duration.asHours() >= 1) {
      return `${Math.floor(duration.asHours())}h ${duration.minutes()}m remaining`;
    } else {
      return `${duration.minutes()}m ${duration.seconds()}s remaining`;
    }
  }

  render() {
    if (this.cycleLength === 0n || this.startTime === 0n) {
      return html`<div>Loading cycle information...</div>`;
    }

    const cycle = this.currentCycle ?? this.calculateCurrentCycle();
    const { timeLeft, percentage } = this.calculateTimeLeft();
    
    return html`
      <div class="cycle-info">
        <div class="cycle-number">Cycle ${cycle.toString()}</div>
        <div class="time-left">${this.formatTimeLeft(timeLeft)}</div>
        <div class="progress-container">
          <sl-progress-bar 
            class="progress-bar" 
            value=${percentage}
          ></sl-progress-bar>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cycle-info': CycleInfo;
  }
}

