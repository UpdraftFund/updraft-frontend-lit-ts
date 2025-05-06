import { Client, cacheExchange, fetchExchange } from '@urql/core';
import { GRAPH_API_KEY } from './env';

//TODO: each chain subgraph will need its own urql client

const prod = false;

const devUrl =
  'https://api.studio.thegraph.com/query/94944/updraft/version/latest';
const prodUrl =
  'https://gateway.thegraph.com/api/subgraphs/id/AX96zuXixk4ugPQG7CDypy1EdRnYE4Z9khjk2fpzHfAq';
const url = prod ? prodUrl : devUrl;
const apiKey = GRAPH_API_KEY;

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
