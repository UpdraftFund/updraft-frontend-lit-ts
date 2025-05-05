import { Client, cacheExchange, fetchExchange } from '@urql/core';

//TODO: each chain subgraph will need its own urql client

const urqlClient = new Client({
  url: 'https://gateway.thegraph.com/api/subgraphs/id/AX96zuXixk4ugPQG7CDypy1EdRnYE4Z9khjk2fpzHfAq',
  exchanges: [cacheExchange, fetchExchange],
  requestPolicy: 'cache-and-network',
});

export default urqlClient;
