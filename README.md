## Getting started.

1. `git clone` the project and `cd` into it.
2. `git submodule init` to install the submodles.
3. `yarn install` to install the dependencies.
4. `yarn build-graph` to build the subgraph
5. `yarn dev` to deploy the test site to your browser. Any changes you do will be hotloaded and immediately visible in your browser.
6. Before you `git push` your changes, run `yarn tsc` to make sure there are no type errors. If there are no errors, then pushing to `dev` (or creating a PR that merges into `dev`) will automatically create a preview site so other people can see your changes.

## [Dev preview site](https://updraft-lit.vercel.app/)
