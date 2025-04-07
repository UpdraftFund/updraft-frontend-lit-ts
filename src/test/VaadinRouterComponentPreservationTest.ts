// Testing with Vaadin Router using LitElement components
import { Router } from '@vaadin/router';
import { fixture, expect, aTimeout, html } from '@open-wc/testing';
import { LitElement, css, html as litHtml } from 'lit';
import sinon from 'sinon';

describe('Vaadin Router Component Preservation with Lit', () => {
  let element: HTMLElement;
  const layoutConnectedSpy = sinon.spy();
  const layoutDisconnectedSpy = sinon.spy();
  let router: Router;

  before(() => {
    // Define test components using LitElement - alternative approach without decorators
    // to avoid TypeScript unused class warnings

    // Method 1: Define and use the class immediately (no decorator)
    class TestAppLayout extends LitElement {
      static styles = css`
        :host {
          display: block;
          padding: 16px;
        }

        h1 {
          color: blue;
        }
      `;

      connectedCallback() {
        super.connectedCallback();
        layoutConnectedSpy();
      }

      disconnectedCallback() {
        super.disconnectedCallback();
        layoutDisconnectedSpy();
      }

      render() {
        return litHtml`
          <div>
            <h1>App Layout</h1>
            <slot></slot>
          </div>
        `;
      }
    }

    customElements.define('test-app-layout', TestAppLayout);

    class PageOne extends LitElement {
      render() {
        return litHtml`<div>Page One</div>`;
      }
    }

    customElements.define('page-one', PageOne);

    class PageTwo extends LitElement {
      render() {
        return litHtml`<div>Page Two</div>`;
      }
    }

    customElements.define('page-two', PageTwo);
  });

  beforeEach(async () => {
    // Reset spies
    layoutConnectedSpy.resetHistory();
    layoutDisconnectedSpy.resetHistory();

    // Create container with proper typing
    element = await fixture<HTMLElement>(html` <div id="outlet"></div>`);

    // Setup router
    router = new Router(element);
    router.setRoutes([
      {
        path: '/',
        component: 'test-app-layout',
        children: [
          { path: '', component: 'page-one' },
          { path: 'two', component: 'page-two' },
        ],
      },
    ]);

    // Give time for initial navigation to complete
    await aTimeout(100);
  });

  it('preserves parent layout component across child route changes', async () => {
    // Verify layout was connected
    expect(layoutConnectedSpy.callCount).to.equal(1);

    // Navigate to a child route
    Router.go('/two');
    await aTimeout(100); // Longer timeout for route change

    // Verify parent wasn't disconnected and reconnected
    expect(layoutDisconnectedSpy.callCount).to.equal(0);
    expect(layoutConnectedSpy.callCount).to.equal(1); // Still just the initial connection

    // Verify page two is shown correctly (note: it will be in shadow DOM)
    const appLayout = element.querySelector('test-app-layout');
    expect(appLayout).to.exist;

    // Wait for rendering to complete
    await aTimeout(50);

    // Look for the page-two component
    const shadowRoot = element.querySelector('test-app-layout')?.shadowRoot;
    expect(shadowRoot).to.exist;

    // The component should be in a slot
    const slotted = element.querySelector('page-two');
    expect(slotted).to.exist;
  });
});
