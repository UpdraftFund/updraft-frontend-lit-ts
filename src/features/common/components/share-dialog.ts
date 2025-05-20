import { customElement, property, query } from 'lit/decorators.js';
import { css, html, LitElement } from 'lit';

import { dialogStyles } from '@/features/common/styles/dialog-styles';

import linkIcon from '@icons/link-45deg.svg';
import xIcon from '@icons/common/twitter-x.svg';
import warpcastIcon from '@icons/common/farcaster.svg';
import share from '@icons/common/share.svg';
import shareThisImage from '@images/share-this-140.png';

import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/dialog/dialog.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import { SlDialog } from '@shoelace-style/shoelace';
import { SlTooltip } from '@shoelace-style/shoelace';

@customElement('share-dialog')
export class ShareDialog extends LitElement {
  static styles = [
    dialogStyles,
    css`
      sl-tooltip {
        --sl-tooltip-arrow-size: 0;
      }

      .dialog-content {
        display: flex;
        gap: 1rem;
      }

      .content-left {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }

      .buttons {
        display: flex;
        flex-wrap: nowrap;
        gap: 0.5rem;
      }

      img {
        border-radius: 15px;
        border: 5px solid var(--control-background);
      }
    `,
  ];

  @query('sl-dialog') dialog!: SlDialog;
  @query('sl-tooltip.clipboard') clipboardTip!: SlTooltip;
  @property() url!: string;
  @property() action!: string;
  @property() topic!: string;

  private async copyLink() {
    try {
      await navigator.clipboard.writeText(this.url);
      this.clipboardTip.content = 'Copied!';
    } catch {
      this.clipboardTip.content = 'Failed to copy';
    }
    this.showClipboardTip();
  }

  private async showClipboardTip() {
    await this.clipboardTip.show();
    setTimeout(() => {
      this.clipboardTip.content = '';
      this.clipboardTip.hide();
    }, 1500);
  }

  private get messageHtml() {
    return html` <b>You ${this.action}:</b> ${this.topic}`;
  }

  private get shareMessage() {
    return `I ${this.action} on Updraft: ${this.topic}`;
  }

  private shareX() {
    const url = new URL('https://twitter.com/intent/tweet');
    url.searchParams.set('url', this.url);
    url.searchParams.set('text', this.shareMessage);
    window.open(url.toString(), '_blank');
  }

  private shareWarpcast() {
    const url = new URL('https://warpcast.com/~/compose');
    url.searchParams.set('text', this.shareMessage);
    url.searchParams.set('embeds[]', this.url);
    window.open(url.toString(), '_blank');
  }

  async show() {
    this.dialog.show();
  }

  render() {
    return html`
      <sl-dialog>
        <p slot="label">
          <sl-icon src=${share}></sl-icon>
          Share
        </p>
        <div class="dialog-content">
          <div class="content-left">
            <p>${this.messageHtml}</p>

            <div class="buttons">
              <sl-button variant="primary" @click=${this.shareX}>
                <sl-icon src=${xIcon}></sl-icon>
              </sl-button>

              <sl-button variant="primary" @click=${this.shareWarpcast}>
                <sl-icon src=${warpcastIcon}></sl-icon>
              </sl-button>

              <sl-tooltip class="clipboard" placement="bottom" trigger="manual">
                <sl-button variant="primary" @click=${this.copyLink}>
                  <sl-icon src=${linkIcon}></sl-icon>
                  Copy Link
                </sl-button>
              </sl-tooltip>
            </div>
          </div>
          <img src=${shareThisImage} width="140" height="140" alt="Share" />
        </div>
      </sl-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'share-dialog': ShareDialog;
  }
}
