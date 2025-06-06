import { customElement, query, state } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';

import calculator from '@icons/common/calculator.svg';
import copy from '@icons/common/copy.svg';

import { dialogStyles } from '@/features/common/styles/dialog-styles';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import { SlDialog, SlTooltip } from '@shoelace-style/shoelace';

import { getBalance, refreshBalances } from '@state/user/balances';
import { shortNum } from '@utils/format-utils';
import { updraftSettings } from '@state/common';

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

      .copy-address {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0.5rem 0;
      }

      sl-spinner {
        font-size: 1rem;
      }
    `,
  ];

  @query('sl-dialog', true) dialog!: SlDialog;
  @query('sl-tooltip.clipboard', true) clipboardTip!: SlTooltip;
  @state() private loadingBalance = false;

  private checkBalance() {
    this.loadingBalance = true;
    refreshBalances().finally(() => {
      this.loadingBalance = false;
    });
  }

  private async copyTokenAddress() {
    const updAddress = updraftSettings.get().updAddress;
    if (updAddress) {
      try {
        await navigator.clipboard.writeText(updAddress);
        this.clipboardTip.content = 'Copied!';
      } catch {
        this.clipboardTip.content = 'Failed to copy';
      }

      // Show and auto-hide tooltip
      await this.clipboardTip.show();
      setTimeout(() => {
        this.clipboardTip.hide();
      }, 1500);
    }
  }

  async show() {
    this.dialog.show();
    // Load balance in the background when dialog is opened
    this.checkBalance();
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
                : shortNum(getBalance('updraft'))}
            </span>
            UPD
          </p>
          <sl-button
            pill
            @click=${this.checkBalance}
            variant="primary"
            size="small"
          >
            <sl-icon
              slot="prefix"
              class="calculator-icon"
              src=${calculator}
            ></sl-icon>
            Refresh Balance
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
            <div class="copy-address">
              <span>UPD Token Address:</span>
              <sl-tooltip class="clipboard" placement="bottom" trigger="manual">
                <sl-button size="small" @click=${this.copyTokenAddress}>
                  <sl-icon src=${copy}></sl-icon>
                  Copy Address
                </sl-button>
              </sl-tooltip>
            </div>
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
