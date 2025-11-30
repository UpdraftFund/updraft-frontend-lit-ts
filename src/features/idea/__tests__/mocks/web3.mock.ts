// Mock for web3.ts

export const modal = {
  connect: () =>
    Promise.resolve({
      address: '0x1234567890123456789012345678901234567890',
      chainId: 42161, // Arbitrum
    }),
  disconnect: () => Promise.resolve(undefined),
  getAccounts: () => Promise.resolve(['0x1234567890123456789012345678901234567890']),
  getNetwork: () =>
    Promise.resolve({
      name: 'Arbitrum',
      chainId: 42161,
    }),
};

// Mock networks - in tests we'll mock both for flexibility
export const networks = [
  { name: 'Arbitrum Sepolia', chainId: 421614 },
  { name: 'Arbitrum', chainId: 42161 },
];

export const adapter = {
  wagmiConfig: {},
};

export const config = {};
