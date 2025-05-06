## Getting started.

1. `git clone --recurse-submodules https://github.com/UpdraftFund/updraft-frontend-lit-ts`
2. `cd updraft-frontend-lit-ts`
3. `yarn install` to install the dependencies.
4. `yarn build-graph` to build the subgraph
5. **Set up environment variables** (see below)
6. `yarn dev` to deploy the test site to your browser. Any changes you do will be hotloaded and immediately visible in
   your browser.
7. Before you `git push` your changes, run `yarn build` to make sure they will build in vercel. If there are no errors,
   then pushing to `dev` (or creating a PR that merges into `dev`) will automatically create a preview site so other
   people can see your changes.

Please also read read
our [Git workflow and branching guide](https://github.com/UpdraftFund/.github?tab=readme-ov-file#git-workflow-and-branching-guide).

## Environment Variables

This project uses environment variables for API keys and other sensitive information. To set up your environment:

1. Copy `.env.example` to `.env.local` in the project root
2. Add your actual API keys to `.env.local`

```bash
cp .env.example .env.local
# Then edit .env.local with your actual values
```

For more details on environment configuration, see [Environment Configuration](src/features/common/utils/README.md).

## [Dev preview site](https://updraft-lit.vercel.app/)
