import { Client, cacheExchange, fetchExchange } from "@urql/core";

const urqlClient = new Client({
  url: "https://api.studio.thegraph.com/query/94944/updraft/version/latest",
  exchanges: [cacheExchange, fetchExchange],
});

export default urqlClient;