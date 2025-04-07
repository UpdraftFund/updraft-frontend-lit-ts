// src/test/LitRouterSlottedLayoutPreservationTest.ts
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from '@lit-labs/router';
import { fixture, expect, aTimeout } from '@open-wc/testing';
import sinon from 'sinon';

// Component that should be preserved (the layout)
@customElement('test-layout-component')
class TestLayoutComponent extends LitElement {
  static renderCount = 0;
  static connectedCallbackSpy = sinon.spy();
  static disconnectedCallbackSpy = sinon.spy();

  // Track internal state that should be preserved
  @state() private menuOpen = false;

  // Track each render for verification
  render() {
    TestLayoutComponent.renderCount++;

    return html`
      <div class="layout">
        <header>
          <h1>App Header</h1>
          <button
            id="toggle-menu"
            @click=${() => (this.menuOpen = !this.menuOpen)}
          >
            ${this.menuOpen ? 'Close Menu' : 'Open Menu'}
          </button>
          <div class="menu" ?hidden=${!this.menuOpen}>Menu Content</div>
        </header>

        <div class="main-content">
          <!-- This is where router content will be placed -->
          <slot></slot>
        </div>

        <footer>Footer Content</footer>
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    TestLayoutComponent.connectedCallbackSpy();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    TestLayoutComponent.disconnectedCallbackSpy();
  }

  static reset() {
    this.renderCount = 0;
    this.connectedCallbackSpy.resetHistory();
    this.disconnectedCallbackSpy.resetHistory();
  }
}

// Page components that will be rendered in routes
@customElement('page-one-component')
class PageOneComponent extends LitElement {
  static renderCount = 0;

  render() {
    PageOneComponent.renderCount++;
    return html` <div>Page One Content</div>`;
  }

  static reset() {
    this.renderCount = 0;
  }
}

@customElement('page-two-component')
class PageTwoComponent extends LitElement {
  static renderCount = 0;

  render() {
    PageTwoComponent.renderCount++;
    return html` <div>Page Two Content</div>`;
  }

  static reset() {
    this.renderCount = 0;
  }
}

// App with slotted layout pattern
@customElement('slotted-router-app')
class SlottedRouterApp extends LitElement {
  @state() private initialized = false;

  router = new Router(this, [
    // Add a default route for the root path
    {
      path: '/',
      render: () => html` <div>Default route - please navigate</div>`,
    },
    {
      path: '/page1',
      render: () => html` <page-one-component></page-one-component>`,
    },
    {
      path: '/page2',
      render: () => html` <page-two-component></page-two-component>`,
    },
  ]);

  navigateToPage1() {
    this.router.goto('/page1');
    this.initialized = true;
  }

  navigateToPage2() {
    this.router.goto('/page2');
    this.initialized = true;
  }

  render() {
    return html`
      <test-layout-component>
        ${this.initialized
          ? this.router.outlet()
          : html`<div>Initializing...</div>`}
      </test-layout-component>
    `;
  }
}

describe('Lit Router with Slotted Layout Preservation', () => {
  let app: SlottedRouterApp;

  beforeEach(async () => {
    // Reset all component state and counters
    TestLayoutComponent.reset();
    PageOneComponent.reset();
    PageTwoComponent.reset();

    // Create and render the test app without auto-navigating
    app = await fixture(html` <slotted-router-app></slotted-router-app>`);
    await app.updateComplete;

    // Manually navigate to initial route
    app.navigateToPage1();
    await app.updateComplete;
    await aTimeout(50); // Ensure all rendering is complete
  });

  it('preserves layout component while only updating slotted content', async () => {
    // Verify initial render state
    expect(TestLayoutComponent.connectedCallbackSpy.callCount).to.equal(1);
    expect(TestLayoutComponent.renderCount).to.be.greaterThan(0);

    // Get baseline render counts
    const initialLayoutRenderCount = TestLayoutComponent.renderCount;
    const initialPage1RenderCount = PageOneComponent.renderCount;

    // Toggle menu to change layout state
    const layoutEl = app.shadowRoot!.querySelector(
      'test-layout-component'
    ) as TestLayoutComponent;
    const toggleButton = layoutEl.shadowRoot!.querySelector(
      '#toggle-menu'
    ) as HTMLButtonElement;
    toggleButton.click();

    await layoutEl.updateComplete;

    // Verify menu toggle caused layout to re-render
    expect(TestLayoutComponent.renderCount).to.be.greaterThan(
      initialLayoutRenderCount
    );

    // Store the new render count after state change
    const layoutRenderCountAfterStateChange = TestLayoutComponent.renderCount;

    // Now navigate to a different route
    app.navigateToPage2();
    await app.updateComplete;
    await aTimeout(50);

    // Verify that:
    // 1. Layout component was NOT disconnected/reconnected
    expect(TestLayoutComponent.disconnectedCallbackSpy.callCount).to.equal(0);
    expect(TestLayoutComponent.connectedCallbackSpy.callCount).to.equal(1);

    // 2. Layout render count didn't increase (no additional renders)
    expect(TestLayoutComponent.renderCount).to.equal(
      layoutRenderCountAfterStateChange
    );

    // 3. Page2 component was rendered
    expect(PageTwoComponent.renderCount).to.be.greaterThan(0);

    // 4. Layout state was preserved
    const menuEl = layoutEl.shadowRoot!.querySelector('.menu') as HTMLElement;
    expect(menuEl.hidden).to.be.false;

    // 5. Navigate back to page1
    app.navigateToPage1();
    await app.updateComplete;
    await aTimeout(50);

    // 6. Verify page1 re-rendered but layout didn't
    expect(TestLayoutComponent.renderCount).to.equal(
      layoutRenderCountAfterStateChange
    );
    expect(PageOneComponent.renderCount).to.be.greaterThan(
      initialPage1RenderCount
    );
  });

  it('preserves layout component state after multiple route changes', async () => {
    // Get layout component and toggle menu state
    const layoutEl = app.shadowRoot!.querySelector(
      'test-layout-component'
    )! as TestLayoutComponent;
    const toggleButton = layoutEl.shadowRoot!.querySelector(
      '#toggle-menu'
    ) as HTMLButtonElement;
    toggleButton.click();

    await layoutEl.updateComplete;

    // Capture render count after state change
    const renderCountAfterStateChange = TestLayoutComponent.renderCount;

    // Perform multiple route changes
    for (let i = 0; i < 3; i++) {
      app.navigateToPage2();
      await app.updateComplete;
      await aTimeout(20);

      app.navigateToPage1();
      await app.updateComplete;
      await aTimeout(20);
    }

    // Verify the layout component:
    // 1. Was rendered the same number of times (no additional renders from navigation)
    expect(TestLayoutComponent.renderCount).to.equal(
      renderCountAfterStateChange
    );

    // 2. Still has its state preserved (menu open)
    const menuEl = layoutEl.shadowRoot!.querySelector('.menu') as HTMLElement;
    expect(menuEl.hidden).to.be.false;

    // 3. Was never disconnected
    expect(TestLayoutComponent.disconnectedCallbackSpy.callCount).to.equal(0);
  });
});
