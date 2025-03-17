import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { consume } from '@lit/context';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';

import { beginnerTasksContext, BeginnerTasksState, BeginnerTask, tasks as defaultTasks } from '../../../state/beginner-tasks-state';
import { userContext, UserState } from '../../../state/user-state';
import type { Balances } from '../../../types/current-user';

@customElement('beginner-tasks')
export class BeginnerTasks extends LitElement {
  @consume({ context: beginnerTasksContext, subscribe: true })
  tasks?: BeginnerTasksState;

  @consume({ context: userContext, subscribe: true })
  user?: UserState;

  static styles = css`
    :host {
      display: block;
    }

    .beginner-tasks {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
      padding: 1rem 0;
    }

    sl-card {
      --padding: 1.25rem;
      position: relative;
    }

    .task-card-title {
      font-family: var(--sl-font-sans);
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .task-card-description {
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    .completed-icon {
      color: var(--sl-color-success-600);
    }

    .task-card-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .upd-balance {
      font-size: 0.875rem;
      color: var(--sl-color-neutral-600);
    }
  `;

  private handleTaskAction(taskId: string, route: string) {
    if (taskId === 'connect-wallet' && this.user) {
      this.user.connect();
    } else if (route) {
      window.location.href = route;
    }
  }

  private renderTask(task: BeginnerTask) {
    const isCompleted = this.tasks?.completedTasks.has(task.id) || false;
    const balances = this.user?.profile?.balances as Balances | undefined;
    const updBalance = balances?.upd?.balance || '0';

    return html`
      <sl-card>
        <h3 class="task-card-title">
          ${task.title}
          ${isCompleted
            ? html`<sl-icon name="check-circle-fill" class="completed-icon"></sl-icon>`
            : ''}
        </h3>
        <p class="task-card-description">${task.description}</p>
        <div class="task-card-actions">
          <sl-button
            variant="primary"
            ?disabled=${isCompleted}
            @click=${() => this.handleTaskAction(task.id, task.route)}
          >
            ${task.buttonText}
          </sl-button>
          ${task.id === 'get-upd'
            ? html`<div class="upd-balance">🪁 ${updBalance} UPD</div>`
            : ''}
        </div>
      </sl-card>
    `;
  }

  render() {
    // Use default tasks if context is not available
    const tasksToRender = this.tasks?.tasks || defaultTasks.get();
    
    return html`
      <h2>Tasks</h2>
      <section class="beginner-tasks">
        ${tasksToRender.map(task => this.renderTask(task))}
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'beginner-tasks': BeginnerTasks;
  }
}
