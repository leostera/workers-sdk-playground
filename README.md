# Workers SDK Artifacts playground

A small end-to-end test of the local Artifacts simulator from [workers-sdk PR 3/3](https://github.com/cloudflare/workers-sdk/pull/16186). It creates a repository through a local binding, pushes a commit with Git, and reads the file back through the binding. It does not deploy a Worker or contact deployed Artifacts.

## Run

Requires Node.js 22+, Git 2.32+, and pnpm. Run:

```sh
npm test
```

The test script shallow-clones `leostera/workers-sdk` branch `lostera/artifacts-devtools-integration` into the ignored `.workers-sdk/` directory, installs that monorepo's dependencies, builds its local Explorer UI and Miniflare, then runs `node --test`. The first run downloads and builds the SDK and takes longer. It prints the exact SDK commit tested. To refresh the branch, remove `.workers-sdk/` and run again.

If you already have a built checkout of the branch, use `WORKERS_SDK_DIR=/absolute/path/to/workers-sdk npm test`. The script still installs dependencies and rebuilds Miniflare. The Git push and repository operations run locally; only SDK setup needs network access.

This tests the simulator on the branch, **not** parity with the deployed service. No customer credentials or Artifacts tokens are stored in the repository.
