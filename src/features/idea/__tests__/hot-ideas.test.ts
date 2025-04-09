import { html, fixture, expect } from '@open-wc/testing';
import sinon from 'sinon';

// Import the mock modules
import mockUrqlClient from './mocks/urql-client.mock';
// We'll use the ideaContext in a future test

// Import the component under test
import '../components/right-side-bar/hot-ideas';

describe('HotIdeas Component', () => {
  let element: HTMLElement;
  let queryStub: sinon.SinonStub;
  let mockIdeas = [
    {
      id: '1',
      title: 'Test Idea 1',
      shares: '100',
      tags: ['tag1', 'tag2'],
      creator: { id: '0x123' },
      startTime: '123456789',
      funderReward: '10',
    },
    {
      id: '2',
      title: 'Test Idea 2',
      shares: '50',
      tags: ['tag3'],
      creator: { id: '0x456' },
      startTime: '123456789',
      funderReward: '20',
    },
  ];

  beforeEach(() => {
    // Create a stub for the query method
    queryStub = sinon.stub();
    queryStub.returns({
      toPromise: sinon.stub().resolves({
        data: {
          ideas: mockIdeas,
        },
      }),
    });

    // Configure the urqlClient mock
    mockUrqlClient.query = queryStub;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('renders with a heading', async () => {
    // Create the element
    element = await fixture(html`<hot-ideas></hot-ideas>`);

    // Check for heading
    const heading = element.shadowRoot?.querySelector('h2');
    expect(heading).to.exist;
    expect(heading?.textContent?.trim()).to.include('Hot Ideas');

    // Check that it's using the icon
    const icon = element.shadowRoot?.querySelector('sl-icon');
    expect(icon).to.exist;
  });

  it('renders ideas from the GraphQL query', async () => {
    element = await fixture(html`<hot-ideas></hot-ideas>`);

    // Wait for task to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Check that ideas are rendered
    const ideaCards = element.shadowRoot?.querySelectorAll('idea-card-small');
    expect(ideaCards?.length).to.equal(2);
  });

  it('calls the GraphQL client with the correct query', async () => {
    element = await fixture(html`<hot-ideas></hot-ideas>`);

    // Check that the query was called
    expect(queryStub.called).to.be.true;
  });

  it('shows a loading spinner initially', async () => {
    // Create a stub that doesn't resolve immediately
    const pendingPromise = new Promise(() => {}); // Never resolves during test
    queryStub.returns({
      toPromise: sinon.stub().returns(pendingPromise),
    });

    element = await fixture(html`<hot-ideas></hot-ideas>`);

    // Check for spinner
    const spinner = element.shadowRoot?.querySelector('sl-spinner');
    expect(spinner).to.exist;
  });

  it('shows a message when no ideas are found', async () => {
    // Configure the mock to return empty ideas array
    queryStub.returns({
      toPromise: sinon.stub().resolves({
        data: {
          ideas: [],
        },
      }),
    });

    element = await fixture(html`<hot-ideas></hot-ideas>`);

    // Wait for task to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Check for no ideas message
    const noIdeas = element.shadowRoot?.querySelector('.no-ideas');
    expect(noIdeas).to.exist;
    expect(noIdeas?.textContent).to.include('No hot ideas found');
  });
});
