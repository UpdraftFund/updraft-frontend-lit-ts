import { customElement, query, state } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { html, SignalWatcher } from '@lit-labs/signals';

import calculator from '@icons/calculator.svg';
import copy from '@icons/copy.svg';
import discord from '@icons/discord.svg';
import uniswap from '@icons/uniswap.svg';

import { dialogStyles } from '@/features/common/styles/dialog-styles';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/spinner/spinner.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import { SlDialog, SlTooltip } from '@shoelace-style/shoelace';

import { getBalance, refreshBalances } from '@state/user/balances';
import { shortNum } from '@utils/format-utils';
import { updraftSettings } from '@state/common';
import { getUniswapLpUrl } from '@utils/environment';

@customElement('upd-dialog')
export class UpdDialog extends SignalWatcher(LitElement) {
  static styles = [
    dialogStyles,
    css`
      .balance-section {
        background: var(--subtle-background);
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1.5rem;
        text-align: center;
      }

      .balance-display {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--accent);
      }

      .balance-amount {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.5rem;
        font-weight: 700;
      }

      .refresh-button {
        background: var(--main-background);
        border: 2px solid var(--border-default);
        border-radius: 8px;
        padding: 0.5rem 0.5rem;
        transition: all 0.2s ease;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: var(--main-foreground);
        text-decoration: none;
        font-family: inherit;
        text-wrap: nowrap;
      }

      .refresh-button:hover {
        border-color: var(--accent);
        background: var(--accent);
        color: var(--main-background);
        transform: translateY(-1px);
      }

      .refresh-button sl-icon {
        font-size: 1rem;
      }

      .options-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .option-card {
        border: 2px solid var(--border-default);
        border-radius: 12px;
        padding: 1rem;
        transition: all 0.2s ease;
        cursor: pointer;
        text-decoration: none;
        color: inherit;
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .option-card:hover {
        border-color: var(--accent);
        background: var(--subtle-background);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .option-icon {
        font-size: 1.5rem;
        color: var(--accent);
        min-width: 2rem;
      }

      .option-content {
        flex: 1;
      }

      .option-title {
        font-weight: 600;
        margin-bottom: 0.25rem;
      }

      .option-description {
        font-size: 0.875rem;
        color: var(--subtle-text);
      }

      .copy-address-card {
        border: 2px solid var(--border-default);
        border-radius: 12px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .copy-button {
        font-size: 0.5rem;
      }

      .address-info {
        flex: 1;
      }

      .address-label {
        font-weight: 600;
        margin-bottom: 0.25rem;
      }

      .address-description {
        font-size: 0.875rem;
        color: var(--subtle-text);
      }

      sl-spinner {
        font-size: 1.5rem;
      }

      h3 {
        margin: 0 0 1rem 0;
        font-size: 1.25rem;
        color: var(--main-foreground);
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
      <sl-dialog open="true" label="Get UPD 🪁">
        <!-- Balance Section -->
        <div class="balance-section">
          <div class="balance-display">Your UPD Balance</div>
          <div class="balance-amount">
            ${this.loadingBalance
              ? html` <sl-spinner></sl-spinner>`
              : shortNum(getBalance('updraft'))}
            UPD
            <button class="refresh-button" @click=${this.checkBalance}>
              <sl-icon src=${calculator}></sl-icon>
              Refresh
            </button>
          </div>
        </div>

        <!-- Options Section -->
        <h3>How to get UPD</h3>
        <div class="options-section">
          <!-- Discord Option -->
          <a
            href="https://discord.gg/mQJ58MY6Nz"
            target="_blank"
            class="option-card"
          >
            <sl-icon class="option-icon" src=${discord}></sl-icon>
            <div class="option-content">
              <div class="option-title">Get free UPD from Discord</div>
              <div class="option-description">
                Join our community and get free UPD tokens
              </div>
            </div>
          </a>

          <!-- Uniswap Option -->
          <a href="${getUniswapLpUrl()}" target="_blank" class="option-card">
            <sl-icon class="option-icon" src=${uniswap}></sl-icon>
            <div class="option-content">
              <div class="option-title">Buy UPD on Uniswap</div>
              <div class="option-description">
                Purchase UPD tokens directly from the liquidity pool
              </div>
            </div>
          </a>

          <!-- Token Address Option -->
          <div class="copy-address-card">
            <div class="address-info">
              <div class="address-label">UPD Token Address</div>
              <div class="address-description">
                Copy the contract address to add UPD to your wallet
              </div>
            </div>
            <sl-tooltip placement="bottom" trigger="manual">
              <sl-button class="copy-button" @click=${this.copyTokenAddress}>
                <sl-icon src=${copy}></sl-icon>
                Copy Address
              </sl-button>
            </sl-tooltip>
          </div>
        </div>
      </sl-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'upd-dialog': UpdDialog;
  }
}
