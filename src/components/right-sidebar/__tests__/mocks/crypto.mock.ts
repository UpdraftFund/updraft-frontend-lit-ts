/**
 * Mock implementation of the Node.js crypto module for browser testing
 * This resolves the error when multiformats tries to import the crypto module
 */

// Create a simple mock of the crypto module with the methods used by multiformats
const crypto = {
  // Mock the randomBytes function used by multiformats
  randomBytes: (size: number): Uint8Array => {
    const bytes = new Uint8Array(size);
    // Fill with deterministic values for testing
    for (let i = 0; i < size; i++) {
      bytes[i] = i % 256;
    }
    return bytes;
  },

  // Add any other crypto methods that might be needed
  createHash: () => {
    return {
      update: () => {
        return {
          digest: () => {
            // Return a deterministic hash for testing
            return Buffer.from('mockhash');
          },
        };
      },
    };
  },
};

export default crypto;
