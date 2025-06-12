/**
 * Environment configuration utilities
 *
 * This module provides utilities for environment-based configuration
 * including network selection and endpoint configuration.
 */

export type Environment = 'development' | 'preview' | 'production';

/**
 * Get the current environment based on VITE_APP_ENV
 */
export function getCurrentEnvironment(): Environment {
  const env = import.meta.env.VITE_APP_ENV;

  if (env === 'production') {
    return 'production';
  }

  if (env === 'preview') {
    return 'preview';
  }

  // Default to development for local development and any other values
  return 'development';
}

/**
 * Check if the current environment is production
 */
export function isProduction(): boolean {
  return getCurrentEnvironment() === 'production';
}

/**
 * Get the appropriate subgraph URL for the current environment
 */
export function getSubgraphUrl(): string {
  if (isProduction()) {
    // Production: Arbitrum One subgraph
    return 'https://gateway.thegraph.com/api/subgraphs/id/8HcLxQ184ZKaTmA6614AsYSj5LtaxAu4DusbmABYgnnF';
  } else {
    // Dev/Preview: Arbitrum Sepolia subgraph
    return 'https://gateway.thegraph.com/api/subgraphs/id/J9Y2YwQwX5QgW1naUe7kGAxPxXAA8A2Tp2SeyNxMB6bH';
  }
}

/**
 * Get the appropriate Uniswap LP URL for the current environment
 */
export function getUniswapLpUrl(): string {
  // For now, both production and dev/preview use the same Arbitrum One LP
  // since there's no LP on Arbitrum Sepolia for dev/preview environments
  // In the future, this can be expanded to support multiple networks
  return 'https://app.uniswap.org/explore/tokens/arbitrum/0x329730dda41c079e684a18c47800572aafe2c1df';
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const environment = getCurrentEnvironment();

  return {
    environment,
    isProduction: isProduction(),
    subgraphUrl: getSubgraphUrl(),
    uniswapLpUrl: getUniswapLpUrl(),
    // Future: Add more environment-specific configuration here
    // such as API endpoints, feature flags, etc.
  };
}
