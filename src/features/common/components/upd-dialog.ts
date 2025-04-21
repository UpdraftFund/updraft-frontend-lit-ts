import { customElement, query, state } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';

import calculator from '@icons/common/calculator.svg';

import { dialogStyles } from '@/features/common/styles/dialog-styles';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import { SlDialog } from '@shoelace-style/shoelace';

import { getBalance, refreshBalances } from '@state/user/balances';

@customElement('upd-dialog')
export class UpdDialog extends SignalWatcher(LitElement) {
  static styles = [
    dialogStyles,
    css`
      .check-balance {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .balance {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
      }

      sl-spinner {
        font-size: 1rem;
      }
    `,
  ];

  @query('sl-dialog') dialog!: SlDialog;
  @state() private loadingBalance = false;

  private handleRecheckBalance() {
    this.loadingBalance = true;
    refreshBalances().finally(() => {
      this.loadingBalance = false;
    });
  }

  async show() {
    this.dialog.show();
  }

  render() {
    return html`
      <sl-dialog label="Get more UPD">
        <span class="check-balance">
          <p>
            You have
            <span class="balance">
              ${this.loadingBalance
                ? html` <sl-spinner></sl-spinner>`
                : getBalance('updraft')}
            </span>
            UPD
          </p>
          <sl-button
            pill
            @click=${this.handleRecheckBalance}
            variant="primary"
            size="small"
          >
            <sl-icon
              slot="prefix"
              class="calculator-icon"
              src=${calculator}
            ></sl-icon>
            Recheck Balance
          </sl-button>
        </span>
        <h3>How to get UPD</h3>
        <ul>
          <li>
            <a href="https://discord.gg/mQJ58MY6Nz" target="_blank">
              Get free UPD from our discord
            </a>
          </li>
          <li>
            <a href="https://app.uniswap.org/swap" target="_blank">
              Swap ETH for UPD on Uniswap
            </a>
          </li>
        </ul>
      </sl-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'upd-dialog': UpdDialog;
  }
}
