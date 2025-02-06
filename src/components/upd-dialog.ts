import { customElement, query } from "lit/decorators.js";
import { css, html, LitElement } from "lit";
import { consume } from "@lit/context";

import calculator from "../assets/icons/calculator.svg"

import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/dialog/dialog.js";
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { SlDialog } from "@shoelace-style/shoelace";

import { balanceContext, Balances, RequestBalanceRefresh } from "../context.ts";

@customElement('upd-dialog')
export class UpdDialog extends LitElement {
  static styles = css`
    sl-dialog::part(panel) {
      border-radius: 15px;
      color: var(--main-foreground);
      background-color: var(--main-background);
    }
    
    sl-dialog::part(title) {
      font-weight: bold;
      font-size: 1.5rem;
    }
    
    .label{
      margin: 0;
    }
    
    sl-dialog::part(body) {
      padding-top: 0;
    }

    .check-balance {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
  `

  @query('sl-dialog') dialog!: SlDialog;

  @consume({ context: balanceContext, subscribe: true }) balances!: Balances;


  private handleRefreshBalance() {
    this.dispatchEvent(new RequestBalanceRefresh());
  }

  async show() {
    this.dialog.show();
  }

  render() {
    return html`
      <sl-dialog>
        <p slot="label" class="label">Get more UPD</p>
        <span class="check-balance">
          <p>You have <span class="balance">${this.balances?.updraft?.balance || '0'}</span> UPD</p>
          <sl-button pill @click=${this.handleRefreshBalance} variant="primary" size="small">
            <sl-icon slot="prefix" class="calculator-icon" src=${calculator}/></sl-icon>
            Recheck Balance
          </sl-button>
        </span>
        <h3>How to get UPD</h3>
        <ul>
          <li><a href="https://discord.gg/mQJ58MY6Nz" target="_blank" rel="noopener">
            Get free UPD from our discord
          </a></li>
      </sl-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'upd-dialog': UpdDialog;
  }
}