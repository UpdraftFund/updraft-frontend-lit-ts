import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

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
    
    sl-input {
      flex: 1;
    }
  `;

  render() {
    return html`
      <sl-input type="search">
        <sl-icon slot="prefix" src=${search}></sl-icon>
      </sl-input>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'search-bar': SearchBar;
  }
}