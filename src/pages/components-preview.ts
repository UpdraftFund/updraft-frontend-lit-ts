import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('components-preview')
export class ComponentsPreview extends LitElement {

  @state()
  isModalOpen = false;

  static styles = css`
    :host {
      display: block;
      padding: 2rem;
    }
    
    .component-section {
      margin-bottom: 2rem;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 8px;
    }
    
    h2 {
      margin-top: 0;
      color: #333;
    }
    
    .variants {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
      align-items: flex-end
    }
  `;

  render() {
    return html`
      <h1>Components Preview</h1>
      
      <demo-wrapper 
        title="Buttons" 
        description="Available button variants"
      >
        <div class="variants">
          <app-button label="Primary Button"></app-button>
          <app-button label="small Button" size="sm"></app-button>
          <app-button label="medium Button" size="md"></app-button>
          <app-button label="large Button" size="lg"></app-button>
        </div>
      </demo-wrapper>
      
      <demo-wrapper 
        title="Tabs" 
        description="Tabbed interface component"
      >
        <example-with-tabs></example-with-tabs>
      </demo-wrapper>

      <demo-wrapper 
        title="Link" 
        description="Anchor tag with custom styling"
      >
        <app-link href="https://rever.co" ?active=${true}>Primary Link</app-link>
        <app-link href="https://rever.co">Primary Link</app-link>
      </demo-wrapper>
      
      <demo-wrapper 
        title="Idea Card" 
        description="Idea card component"
      >
        <div style="display: flex; justify-content: space-between;">
          <app-idea-card 
            title="Decentralized Solar Power Grid for Remote Communities" 
            description="Imagine a network where remote communities can generate, share, and trade solar energy on a decentralized grid. This solution empowers local users to become energy self-sufficient, reducing reliance on traditional power sources and enabling clean energy access even in the most isolated regions. Support this idea to fuel renewable energy transformation and make a lasting environmental impact"
            createdBy="Sina.eth" 
            createdAt="29 days ago" 
            supportUPDAmount="100"
            style="width: 32%"
          ></app-idea-card>

          <app-idea-card 
            title="Decentralized Solar Power Grid for Remote Communities" 
            description="Imagine a network where remote communities can generate, share, and trade solar energy on a decentralized grid. This solution empowers local users to become energy self-sufficient, reducing reliance on traditional power sources and enabling clean energy access even in the most isolated regions. Support this idea to fuel renewable energy transformation and make a lasting environmental impact"
            createdBy="Sina.eth" 
            createdAt="29 days ago" 
            supportUPDAmount="100"
            style="width: 32%"
          ></app-idea-card>
          
          <app-idea-card 
            title="Decentralized Solar Power Grid for Remote Communities" 
            description="Imagine a network where remote communities can generate, share, and trade solar energy on a decentralized grid. This solution empowers local users to become energy self-sufficient, reducing reliance on traditional power sources and enabling clean energy access even in the most isolated regions. Support this idea to fuel renewable energy transformation and make a lasting environmental impact"
            createdBy="Sina.eth" 
            createdAt="29 days ago" 
            supportUPDAmount="100"
            style="width: 32%"
          ></app-idea-card>
        </div>
      </demo-wrapper>
      
      <demo-wrapper 
        title="Section Header" 
        description="Section header component"
      >
        <app-section-header title="Your Activities" icon="wave-pulse"></app-section-header>
      </demo-wrapper>

      <demo-wrapper 
        title="Overall Card" 
        description="Overall card component"
      >
        <div style="display: flex; gap: 1rem;">
          <app-overall-card style="min-width: 190px" title="Drafted Ideas" value="10" variant="blue"></app-overall-card>
          <app-overall-card style="min-width: 190px" title="Supported Ideas" value="23" variant="radishical"></app-overall-card>
          <app-overall-card style="min-width: 190px" title="Drafted Solutions" value="10" variant="golden"></app-overall-card>
        </div>
      </demo-wrapper>

      <demo-wrapper 
        title="Modal" 
        description="Modal component"
      >
        <app-button @click=${() => this.isModalOpen = true}>Open Modal</app-button> 
        <app-modal ?isOpen=${this.isModalOpen} @close=${() => this.isModalOpen = false} title="Modal Title">
          <p>Modal body</p>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
            <app-button>Cancel</app-button>
            <app-button variant="primary">Save</app-button>
          </div>
        </app-modal>
      </demo-wrapper>

      <demo-wrapper 
        title="Input" 
        description="Input component"
      >
        <div style="display: flex; flex-direction: column; gap: 1rem;">
          <app-input label="Input Label" placeholder="Input placeholder"></app-input>
          <app-input placeholder="Input placeholder"></app-input>
          <app-textarea label="Textarea Label" placeholder="Textarea placeholder"></app-textarea>
        </div>
      </demo-wrapper>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'components-preview': ComponentsPreview;
  }
} 