import { customElement, property } from "lit/decorators.js";
import { LitComponent } from "../litComponent";
import { css, html } from "lit";

@customElement('app-tag')
export class AppTag extends LitComponent {
    @property({ type: String })
    variant: 'blue' | 'radishical' | 'golden' = 'blue';


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

        .tag.golden {
            background-color: var(--golden-snitch-400);
            color: var(--golden-snitch-1000);
        }

        .tag.radishical {
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
        'app-tag': AppTag;
    }
}