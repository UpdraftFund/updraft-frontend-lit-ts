import { customElement, property, state } from "lit/decorators.js";
import { html, LitElement } from "lit";
import { IdeaDocument } from '../../.graphclient';
import urqlClient from '../urql-client';
import '../components/layout/top-bar'

@customElement('idea-page')
export class IdeaPage extends LitElement {
  @property() ideaId?: string;

  //TODO: each Idea URL should include a network

  @state() private data?: object;
  @state() private error?: object;
  @state() private loading: boolean = false;

  render() {
    return html`
      <top-bar></top-bar>
      <div class="idea-page">
        <p>Idea ID: ${this.ideaId}</p>
      </div>
      <p>${this.loading ? 'Loading...' : 'You can find the result below...'}</p>
      <fieldset>
        ${this.data
          ? html`<form>
              <label>Data</label>
              <br />
              <textarea readOnly rows="25" cols="80">${JSON.stringify(this.data, null, 2)}</textarea>
            </form>`
          : ''}
        ${this.error
          ? html`<form>
              <label>Error</label>
              <br />
              <textarea readOnly rows="25" cols="80">${JSON.stringify(this.error, null, 2)}</textarea>
            </form>`
          : ''}
      </fieldset>
    `;
  }

  async firstUpdated() {
    if (this.ideaId) {
      this.loading = true;
      try {
        const result = await urqlClient.query(IdeaDocument, { ideaId: this.ideaId });
        this.data = result.data;
        this.error = result.error;
      } catch (e) {
        this.error = e as object;
      } finally {
        this.loading = false;
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'idea-page': IdeaPage;
  }
}
