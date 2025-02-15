import { customElement, property } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { consume } from "@lit/context";
import { Task } from '@lit/task';
import { formatUnits } from "viem";

import compass from '@icons/compass.svg';
import house from '@icons/house.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@components/section-heading';
import '@components/idea-card-small';

import { connectionContext, updraftSettings } from "@/context.ts";
import { Connection, UpdraftSettings } from "@/types";
import urqlClient from "@/urql-client.ts";
import { IdeasByFunderDocument } from "@gql";

@customElement('left-side-bar')
export class LeftSideBar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      border-right: 3px solid var(--layout-divider);
      overflow: hidden;
      padding: 0 1rem;
    }

    nav ul {
      list-style: none;
      padding: 0;
    }

    nav a {
      text-decoration: none;
      color: inherit;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      padding: .75rem;
    }

    nav a.active {
      color: var(--accent);
      background: var(--subtle-background);
    }

    nav a:hover {
      text-decoration: underline;
      color: var(--accent);
    }

    sl-icon {
      font-size: 24px;
    }

    section-heading {
      color: var(--section-heading);
      padding: 0 1rem;
    }

    .my-ideas {
      padding: 1rem 1.4rem 0;
      box-sizing: border-box;
    }

    idea-card-small {
      width: 100%
    }

  `;

  private readonly ideaContributions = new Task(this, {
    task: async ([funder]) => {
      if (funder) {
        const result = await urqlClient.query(IdeasByFunderDocument, { funder });
        return result.data?.ideaContributions;
      }
    },
    args: () => [this.connection.address] as const
  });

  @consume({ context: connectionContext, subscribe: true }) connection!: Connection;
  @consume({ context: updraftSettings, subscribe: true }) updraftSettings!: UpdraftSettings;

  @property({ reflect: true }) location: string | null = null;

  render() {
    return html`
      <nav>
        <ul>
          <li><a href="/" class=${this.location === 'home' ? 'active' : ''}>
            <sl-icon src=${house}></sl-icon>
            Home
          </a></li>
          <li><a href="/discover" class=${this.location === 'discover' ? 'active' : ''}>
            <sl-icon src=${compass}></sl-icon>
            Discover
          </a></li>
        </ul>
      </nav>
      <section-heading>My Ideas</section-heading>
      <div class="my-ideas">
        ${this.ideaContributions.render({
          complete: (ics) => ics?.map(ic => html`
            <idea-card-small
                .startTime=${ic.idea.startTime}
                .funderReward=${ic.idea.funderReward * 100 / this.updraftSettings.percentScale}
                .name=${ic.idea.name}
                .description=${ic.idea.description}
                .id=${ic.idea.id}
                .shares=${formatUnits(ic.idea.shares, 18)}
            ></idea-card-small>
          `)
        })}
      </div>
      <section-heading>My Solutions</section-heading>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'left-side-bar': LeftSideBar;
  }
}