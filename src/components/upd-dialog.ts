import { customElement, query } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';
import { consume } from '@lit/context';

import calculator from '@icons/calculator.svg'

import { dialogStyles } from '@styles/dialog-styles';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import { SlDialog } from '@shoelace-style/shoelace';

import { balanceContext, RequestBalanceRefresh } from '@/context';
import { Balances } from '@/types';

@customElement('upd-dialog')
export class UpdDialog extends LitElement {
  static styles = [
    dialogStyles,
    css`
    .check-balance {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
  `];

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
      <sl-dialog label="Get more UPD">
        <span class="check-balance">
          <p>You have <span class="balance">${this.balances?.updraft?.balance || '0'}</span> UPD</p>
          <sl-button pill @click=${this.handleRefreshBalance} variant="primary" size="small">
            <sl-icon slot="prefix" class="calculator-icon" src=${calculator}/></sl-icon>
            Recheck Balance
          </sl-button>
        </span>
        <h3>How to get UPD</h3>
        <ul>
          <li><a href="https://discord.gg/mQJ58MY6Nz" target="_blank">
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