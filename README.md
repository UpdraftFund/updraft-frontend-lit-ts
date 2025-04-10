## Getting started.

1. `git clone --recurse-submodules https://github.com/UpdraftFund/updraft-frontend-lit-ts`
2. `cd updraft-frontend-lit-ts`
3. `yarn install` to install the dependencies.
4. `yarn build-graph` to build the subgraph
5. `yarn dev` to deploy the test site to your browser. Any changes you do will be hotloaded and immediately visible in your browser.
6. Before you `git push` your changese, run `yarn build` to make sure they will build in vercel. If there are no errors, then pushing to `dev` (or creating a PR that merges into `dev`) will automatically create a preview site so other people can see your changes.

Please also read read our [Git workflow and branching guide](https://github.com/UpdraftFund/.github?tab=readme-ov-file#git-workflow-and-branching-guide). 

## [Dev preview site](https://updraft-lit.vercel.app/)
