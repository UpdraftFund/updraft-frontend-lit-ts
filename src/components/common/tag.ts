import { customElement, property } from "lit/decorators.js";
import { LitComponent } from "../litComponent";
import { css, html } from "lit";

@customElement('app-tag')
export class Tag extends LitComponent {
    @property({ type: String })
    variant: 'blue' | 'gold' | 'red' = 'blue';


    static styles = css`
        :host {
            display: inline-block;
        }

        .tag {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }

        .tag.blue {
            background-color: var(--river-blue-400);
            color: var(--river-blue-1000);
        }

        .tag.gold {
            background-color: var(--golden-snitch-400);
            color: var(--golden-snitch-1000);
        }

        .tag.red {
            background-color: var(--radishical-400);
            color: var(--radishical-1000);
        }
    `;

    render() {
        return html`
            <span class="tag ${this.variant}">
                <slot></slot>
            </span>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        'app-tag': Tag;
    }
}