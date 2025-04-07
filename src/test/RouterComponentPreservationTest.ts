// src/test/router-component-preservation.test.ts
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Task } from '@lit/task';
import { Router } from '@lit-labs/router';
import { fixture, expect, aTimeout } from '@open-wc/testing';
import sinon from 'sinon';

// Test component that tracks lifecycle
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

// App with router
@customElement('test-router-app')
class TestRouterApp extends LitElement {
  @state()
  private _initialized = false;

  router = new Router(this, [
    // Add a default route to handle the root path
    {
      path: '/',
      render: () => html` <div>Default route</div>`,
    },
    {
      path: '/route1',
      render: () => html`
        <div id="route1">
          <h1>Route 1</h1>
          <test-preservation-component></test-preservation-component>
        </div>
      `,
    },
    {
      path: '/route2',
      render: () => html`
        <div id="route2">
          <h1>Route 2</h1>
          <test-preservation-component></test-preservation-component>
        </div>
      `,
    },
  ]);

  // Add methods to navigate programmatically
  navigateToRoute1() {
    this.router.goto('/route1');
    this._initialized = true;
  }

  navigateToRoute2() {
    this.router.goto('/route2');
    this._initialized = true;
  }

  render() {
    return html` <main>
      ${this._initialized ? this.router.outlet() : html`Loading...`}
    </main>`;
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
