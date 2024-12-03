import { createClient, cacheExchange, fetchExchange } from "urql";

const APIURL =
  "https://api.studio.thegraph.com/query/94944/updraft/version/latest";

const client = createClient({
  url: APIURL,
  exchanges: [cacheExchange, fetchExchange],
});

export { client };