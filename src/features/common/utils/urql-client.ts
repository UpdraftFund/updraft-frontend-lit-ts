import { Client, cacheExchange, fetchExchange } from '@urql/core';

//TODO: each chain subgraph will need its own urql client

const prod = false;

const devUrl =
  'https://api.studio.thegraph.com/query/94944/updraft/version/latest';
const prodUrl =
  'https://gateway.thegraph.com/api/subgraphs/id/AX96zuXixk4ugPQG7CDypy1EdRnYE4Z9khjk2fpzHfAq';
const url = prod ? prodUrl : devUrl;
// Use Vite's environment variable system for the API key
// This will be replaced at build time with the actual value from .env.local or Vercel
const apiKey = import.meta.env.VITE_GRAPH_API_KEY || '';

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
