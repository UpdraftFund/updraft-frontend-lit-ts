// src/test/RouterComponentPreservationTest3.ts
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

  static connectedCallbackSpy = sinon.spy();
  static disconnectedCallbackSpy = sinon.spy();

  @state()
  counter = 0;

  myTask = new Task(this, {
    task: async () => {
      console.log(`Task running in instance ${this.instanceId}`);
      this.taskRunCount++;
      await aTimeout(10);
      return `Data loaded at ${Date.now()}`;
    },
    args: () => [],
  });

  connectedCallback() {
    super.connectedCallback();
    (
      this.constructor as typeof TestPreservationComponent
    ).connectedCallbackSpy();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    (
      this.constructor as typeof TestPreservationComponent
    ).disconnectedCallbackSpy();
  }

  taskRunCount = 0;

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

// App with layout-level preservation pattern
@customElement('layout-preservation-router-app')
class LayoutPreservationRouterApp extends LitElement {
  router = new Router(this, [
    {
      path: '/',
      render: () => html` <div>Default route content</div>`,
      enter: () => {
        return true;
      },
    },
    {
      path: '/route1',
      enter: () => {
        return true;
      },
      render: () => html`<h1>Route 1 Content</h1>`,
    },
    {
      path: '/route2',
      enter: () => {
        return true;
      },
      render: () => html`<h1>Route 2 Content</h1>`,
    },
  ]);

  navigateToRoute1() {
    this.router.goto('/route1');
  }

  navigateToRoute2() {
    this.router.goto('/route2');
  }

  // Similar to MyApp's pattern - the component is part of the layout, not the route content
  render() {
    return html`
      <div class="layout">
        <header>
          <h1>App Header</h1>
        </header>

        <div class="sidebar">
          <!-- Persistent component in the layout -->
          <test-preservation-component></test-preservation-component>
        </div>

        <main class="content">
          <!-- Only this part changes when routes change -->
          ${this.router.outlet()}
        </main>

        <footer>
          <p>App Footer</p>
        </footer>
      </div>
    `;
  }
}

describe('Router Component Preservation with Layout Pattern', () => {
  let element: LayoutPreservationRouterApp;

  beforeEach(async () => {
    TestPreservationComponent.resetCounters();

    element = await fixture(
      html` <layout-preservation-router-app></layout-preservation-router-app>`
    );

    // Navigate to initial route
    element.navigateToRoute1();
    await element.updateComplete;
    await aTimeout(50); // Ensure all rendering is complete
  });

  it('preserves component instances across route changes', async () => {
    // Verify we start with one instance
    expect(TestPreservationComponent.connectedCallbackSpy.callCount).to.equal(
      1
    );

    // Get reference to the component
    const initialComponent = element.shadowRoot!.querySelector(
      'test-preservation-component'
    );
    expect(initialComponent).to.exist;

    // Modify state to verify preservation
    const incrementBtn =
      initialComponent!.shadowRoot!.querySelector('#increment');
    (incrementBtn as HTMLElement).click();
    await element.updateComplete;

    // Store state before navigation
    const counterBefore = (initialComponent as TestPreservationComponent)
      .counter;
    const instanceIdBefore = (initialComponent as TestPreservationComponent)
      .instanceId;

    // Navigate to route2
    element.navigateToRoute2();
    await element.updateComplete;
    await aTimeout(50); // Ensure all rendering is complete

    // Get component reference after navigation
    const afterComponent = element.shadowRoot!.querySelector(
      'test-preservation-component'
    );
    expect(afterComponent).to.exist;

    // Main test assertions
    expect(
      TestPreservationComponent.connectedCallbackSpy.callCount,
      'Component was recreated - connectedCallback called more than once'
    ).to.equal(1);

    expect(
      TestPreservationComponent.disconnectedCallbackSpy.callCount,
      'Component was destroyed - disconnectedCallback was called'
    ).to.equal(0);

    expect(
      (afterComponent as TestPreservationComponent).instanceId,
      'Component instance ID changed'
    ).to.equal(instanceIdBefore);

    expect(
      (afterComponent as TestPreservationComponent).counter,
      'Component state was not preserved'
    ).to.equal(counterBefore);

    // Navigate back to route1 and verify again
    element.navigateToRoute1();
    await element.updateComplete;
    await aTimeout(50);

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
    await aTimeout(50);

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
