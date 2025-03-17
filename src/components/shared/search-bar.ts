import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import search from '@icons/search.svg';

import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';

@customElement('search-bar')
export class SearchBar extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex: 1;
      max-width: 450px;
    }

    sl-form {
      flex: 1;
    }
  `;

  @property({ type: String, reflect: true }) value = '';

  connectedCallback() {
    super.connectedCallback();
    // Get search parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    this.value = urlParams.get('search') || '';

    // Listen for URL changes
    this._onPopState = this._onPopState.bind(this);
    window.addEventListener('popstate', this._onPopState);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('popstate', this._onPopState);
  }

  private _onPopState() {
    const urlParams = new URLSearchParams(window.location.search);
    this.value = urlParams.get('search') || '';
  }

  render() {
    return html`
      <form action="/discover" aria-label="Search">
        <input type="hidden" name="tab" value="search" />
        <sl-input
          type="search"
          name="search"
          value=${this.value}
          aria-label="Search Updraft"
          placeholder="Search"
          required
        >
          <sl-icon slot="prefix" src=${search}></sl-icon>
        </sl-input>
      </sl-form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'search-bar': SearchBar;
  }
}
