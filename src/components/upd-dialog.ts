import { customElement, query } from "lit/decorators.js";
import { css, html, LitElement } from "lit";
import "@shoelace-style/shoelace/dist/components/dialog/dialog.js";
import { SlDialog } from "@shoelace-style/shoelace";

@customElement('upd-dialog')
export class UpdDialog extends LitElement {
  static styles = css`
    sl-dialog::part(panel) {
      border-radius: 15px;
      color: var(--main-foreground);
      background-color: var(--main-background);
    }
  `

  @query('sl-dialog') dialog!: SlDialog;

  async show() {
    this.dialog.show();
  }

  render() {
    return html`
      <sl-dialog label="Get more UPD">
      </sl-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'upd-dialog': UpdDialog;
  }
}