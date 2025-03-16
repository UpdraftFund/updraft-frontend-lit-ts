import { stub } from 'sinon';

// Create a mock urqlClient with a stub instead of a spy
const mockUrqlClient = {
  query: stub()
};

// Export the mock as default
export default mockUrqlClient;
