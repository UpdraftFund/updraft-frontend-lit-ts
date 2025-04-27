import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import searchIcon from '@icons/navigation/search.svg';

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

    form {
      flex: 1;
    }
  `;

  @property({ type: String, reflect: true }) search = '';

  render() {
    return html`
      <form action="/discover">
        <sl-input type="search" name="search" value=${this.search}>
          <sl-icon slot="prefix" src=${searchIcon}></sl-icon>
        </sl-input>
      </form>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'search-bar': SearchBar;
  }
}
