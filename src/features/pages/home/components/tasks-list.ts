import { customElement } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

// Components
import './beginner-tasks';
import './campaigns-list.ts';

@customElement('tasks-list')
export class TasksList extends LitElement {
  static styles = css`
    h2 {
      margin: 1.5rem 0 1rem;
    }
    .tasks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.25rem;
      margin-bottom: 1.25rem;
    }
  `;

  render() {
    return html`
      <h2>Tasks</h2>
      <div class="tasks-grid">
        <beginner-tasks></beginner-tasks>
        <campaigns-list></campaigns-list>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tasks-list': TasksList;
  }
}
