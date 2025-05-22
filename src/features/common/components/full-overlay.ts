import { customElement, property } from 'lit/decorators.js';
import { css, LitElement } from 'lit';
import { html } from 'lit';

/**
 * A full-size overlay component that can be used to create modal-like experiences
 * or to block interaction with the underlying content.
 *
 * @element full-overlay
 * @fires overlay-click - Fired when the overlay is clicked
 *
 * @example
 * <full-overlay active></full-overlay>
 *
 * @example
 * <full-overlay active position="fixed" opacity="0.7" z-index="100"></full-overlay>
 */
@customElement('full-overlay')
export class FullOverlay extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .overlay {
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, var(--overlay-opacity, 0.5));
      transition: opacity 0.3s ease-in-out;
      opacity: 0;
      pointer-events: none;
    }

    .overlay.active {
      opacity: 1;
      pointer-events: auto;
    }

    .overlay.position-absolute {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }

    .overlay.position-fixed {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      /* top is set via the topOffset property */
    }

    .overlay.position-relative {
      position: relative;
      height: 100%;
    }
  `;

  /**
   * Whether the overlay is active (visible)
   */
  @property({ type: Boolean, reflect: true }) active = false;

  /**
   * The position of the overlay
   * @type {'absolute'|'fixed'|'relative'}
   */
  @property({ type: String }) position: 'absolute' | 'fixed' | 'relative' =
    'absolute';

  /**
   * The opacity of the overlay (0-1)
   */
  @property({ type: Number }) opacity = 0.5;

  /**
   * The z-index of the overlay
   */
  @property({ type: Number }) zIndex = 10;

  /**
   * The top offset for fixed position overlays (useful for avoiding the top bar)
   */
  @property({ type: String }) topOffset = '0';

  /**
   * Whether the overlay should only be shown on mobile screens (≤768px)
   */
  @property({ type: Boolean }) mobileOnly = false;

  /**
   * Handler for overlay click events
   */
  private handleClick(e: MouseEvent) {
    // Prevent clicks from propagating to elements underneath
    e.stopPropagation();

    // Dispatch a custom event that can be listened for
    this.dispatchEvent(
      new CustomEvent('overlay-click', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private mobileMediaQuery = window.matchMedia('(max-width: 768px)');

  private isMobile() {
    return this.mobileMediaQuery.matches;
  }

  private handleMediaChange = () => {
    // Force re-render when media query changes
    this.requestUpdate();
  };

  connectedCallback() {
    super.connectedCallback();
    this.mobileMediaQuery.addEventListener('change', this.handleMediaChange);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.mobileMediaQuery.removeEventListener('change', this.handleMediaChange);
  }

  render() {
    // If mobileOnly is true, only show on mobile screens
    const isActive = this.mobileOnly
      ? this.active && this.isMobile()
      : this.active;

    return html`
      <div
        class="overlay position-${this.position} ${isActive ? 'active' : ''}"
        style="--overlay-opacity: ${this.opacity}; z-index: ${this
          .zIndex}; ${this.position === 'fixed'
          ? `top: ${this.topOffset};`
          : ''}"
        @click=${this.handleClick}
      >
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'full-overlay': FullOverlay;
  }
}
