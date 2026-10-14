# Workers SDK Artifacts playground

A small end-to-end test of the local Artifacts simulator from [workers-sdk PR 3/3](https://github.com/cloudflare/workers-sdk/pull/16186).

Requires Node.js 22+, Git 2.32+, and npm. No Cloudflare credentials or globally installed pnpm are needed.

```sh
npm i
npm test
```

`npm i` fetches the PR branch source into the ignored `.workers-sdk/` directory, installs its pnpm workspace dependencies, and builds Miniflare. `npm test` creates a repository through a local Artifacts binding, pushes a commit with Git, and reads the file back. The install prints the exact SDK commit tested; remove `.workers-sdk/` and run `npm i` to pick up a newer branch head.

A direct `npm install github:leostera/workers-sdk#lostera/artifacts-devtools-integration` does not work: the GitHub repository root is a pnpm monorepo with `catalog:` dependencies, not an installable Miniflare package. The `postinstall` script does the source build so the two commands above work from a fresh clone.

Only the SDK installation requires network access. The test does not deploy a Worker or contact deployed Artifacts; it does not establish parity with the deployed service. No credentials or repository tokens are stored in this repository.
