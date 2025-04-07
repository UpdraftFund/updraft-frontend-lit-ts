// src/test/RouterComponentPreservationTest.ts
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Task } from '@lit/task';
import { Router } from '@lit-labs/router';
import { fixture, expect, aTimeout } from '@open-wc/testing';
import sinon from 'sinon';

// Key component: we need to ensure this has a unique location in the template
// to enable Lit's keyed rendering to preserve it
@customElement('test-preservation-component')
class TestPreservationComponent extends LitElement {
  static instanceCounter = 0;
  instanceId = ++TestPreservationComponent.instanceCounter;

  // Properly type the static spy properties
  static connectedCallbackSpy = sinon.spy();
  static disconnectedCallbackSpy = sinon.spy();

  @state()
  counter = 0;

  // Create a task that we can track
  myTask = new Task(this, {
    task: async () => {
      console.log(`Task running in instance ${this.instanceId}`);
      this.taskRunCount++;
      await aTimeout(10); // Small delay to simulate async work
      return `Data loaded at ${Date.now()}`;
    },
    args: () => [],
  });

  // Spy on lifecycle methods
  connectedCallback() {
    super.connectedCallback();
    // Fix the static property access
    (
      this.constructor as typeof TestPreservationComponent
    ).connectedCallbackSpy();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Fix the static property access
    (
      this.constructor as typeof TestPreservationComponent
    ).disconnectedCallbackSpy();
  }

  // Track task runs
  taskRunCount = 0;

  // Reset counters between tests
  static resetCounters() {
    TestPreservationComponent.instanceCounter = 0;
    TestPreservationComponent.connectedCallbackSpy.resetHistory();
    TestPreservationComponent.disconnectedCallbackSpy.resetHistory();
  }

  render() {
    return html`
      <div>
        <h2>Component ID: ${this.instanceId}</h2>
        <p>Counter: ${this.counter}</p>
        <p>Task result: ${this.myTask.value}</p>
        <button id="increment" @click=${() => this.counter++}>Increment</button>
      </div>
    `;
  }
}

// App with router using a keyed slot approach to preserve components
@customElement('test-router-app')
class TestRouterApp extends LitElement {
  @state()
  currentRoute = '';

  // Create a single component instance that can be reused
  sharedComponent = html` <test-preservation-component
    key="shared"
  ></test-preservation-component>`;

  router = new Router(this, [
    {
      path: '/',
      render: () => html` <div>Default route</div>`,
    },
    {
      path: '/route1',
      enter: () => {
        this.currentRoute = 'route1';
        return true;
      },
      render: () => html`
        <div id="route1">
          <h1>Route 1</h1>
          <div id="component-slot">${this.sharedComponent}</div>
        </div>
      `,
    },
    {
      path: '/route2',
      enter: () => {
        this.currentRoute = 'route2';
        return true;
      },
      render: () => html`
        <div id="route2">
          <h1>Route 2</h1>
          <div id="component-slot">${this.sharedComponent}</div>
        </div>
      `,
    },
  ]);

  // Add methods to navigate programmatically
  navigateToRoute1() {
    this.router.goto('/route1');
  }

  navigateToRoute2() {
    this.router.goto('/route2');
  }

  render() {
    return html` <main>${this.router.outlet()}</main>`;
  }
}

describe('Router Component Preservation', () => {
  let element: TestRouterApp;

  beforeEach(async () => {
    // Reset component counters
    TestPreservationComponent.resetCounters();

    // Create the test app with router
    element = await fixture(html` <test-router-app></test-router-app>`);

    // Navigate to initial route
    element.navigateToRoute1();
    await element.updateComplete;

    // Ensure the component is fully rendered before proceeding
    await aTimeout(20);
  });

  it('preserves component instances across route changes', async () => {
    // Verify we start with one instance
    expect(TestPreservationComponent.connectedCallbackSpy.callCount).to.equal(
      1
    );

    // Get reference to the component on first route
    const route1Component = element.shadowRoot!.querySelector(
      'test-preservation-component'
    );
    expect(route1Component).to.exist;

    // Modify state to verify preservation
    const incrementBtn =
      route1Component!.shadowRoot!.querySelector('#increment');
    (incrementBtn as HTMLElement).click();
    await element.updateComplete;

    // Store state before navigation
    const counterBefore = (route1Component as TestPreservationComponent)
      .counter;
    const instanceIdBefore = (route1Component as TestPreservationComponent)
      .instanceId;

    // Navigate to route2
    element.navigateToRoute2();
    await element.updateComplete;
    await aTimeout(20); // Give time for rendering

    // Get component reference after navigation
    const route2Component = element.shadowRoot!.querySelector(
      'test-preservation-component'
    );
    expect(route2Component).to.exist;

    // Main test assertions:

    // 1. If components are preserved, connectedCallback should not be called again
    expect(
      TestPreservationComponent.connectedCallbackSpy.callCount,
      'Component was recreated - connectedCallback called more than once'
    ).to.equal(1);

    // 2. Verify disconnectedCallback was not called
    expect(
      TestPreservationComponent.disconnectedCallbackSpy.callCount,
      'Component was destroyed - disconnectedCallback was called'
    ).to.equal(0);

    // 3. Verify instance ID remains the same
    expect(
      (route2Component as TestPreservationComponent).instanceId,
      'Component instance ID changed'
    ).to.equal(instanceIdBefore);

    // 4. Verify state was preserved
    expect(
      (route2Component as TestPreservationComponent).counter,
      'Component state was not preserved'
    ).to.equal(counterBefore);

    // 5. Navigate back to route1 and verify again
    element.navigateToRoute1();
    await element.updateComplete;
    await aTimeout(20); // Give time for rendering

    const routeBackComponent = element.shadowRoot!.querySelector(
      'test-preservation-component'
    );
    expect(
      (routeBackComponent as TestPreservationComponent).instanceId,
      'Component instance changed when navigating back'
    ).to.equal(instanceIdBefore);
  });

  it('does not automatically re-run tasks when navigating', async () => {
    // Get initial component
    const initialComponent = element.shadowRoot!.querySelector(
      'test-preservation-component'
    ) as TestPreservationComponent;
    const initialTaskRunCount = initialComponent.taskRunCount;

    // Navigate to route2
    element.navigateToRoute2();
    await element.updateComplete;
    await aTimeout(20); // Give time for rendering

    // Get component after navigation
    const afterComponent = element.shadowRoot!.querySelector(
      'test-preservation-component'
    ) as TestPreservationComponent;

    // Verify task didn't run again
    expect(
      afterComponent.taskRunCount,
      'Task re-ran when navigating routes'
    ).to.equal(initialTaskRunCount);
  });
});
