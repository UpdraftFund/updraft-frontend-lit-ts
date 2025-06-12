import { Client, cacheExchange, fetchExchange } from '@urql/core';
import { getSubgraphUrl } from '@state/common/environment';

//TODO: each chain subgraph will need its own urql client

// Get environment-appropriate subgraph URL
const url = getSubgraphUrl();

// Use Vite's environment variable system for the API key
// This will be replaced at build time with the actual value from .env.local or Vercel
const apiKey = import.meta.env.VITE_GRAPH_API_KEY;

const urqlClient = new Client({
  url,
  fetchOptions: {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  },
  exchanges: [cacheExchange, fetchExchange],
  requestPolicy: 'cache-and-network',
});

export default urqlClient;
