# Workers SDK Artifacts playground

A small end-to-end test of the local Artifacts simulator from [workers-sdk PR 3/3](https://github.com/cloudflare/workers-sdk/pull/16186).

Requires Node.js 22+, Git 2.32+, and npm. No Cloudflare credentials are needed.

```sh
npm i
npm test
```

The dependency is the [Miniflare preview for PR #16186](https://github.com/cloudflare/workers-sdk/pull/16186), published by Workers SDK's documented [`pkg.pr.new` workflow](https://github.com/cloudflare/workers-sdk/blob/main/CONTRIBUTING.md#pr-previews). It is pinned to the 3/3 branch commit `045645085287874ac2f44606dfddd5718c78df1c` so a later force-push cannot silently change what the playground installs. The test creates a local repository through an Artifacts binding, pushes a commit with Git, and reads the file back. It does not deploy a Worker or contact deployed Artifacts.
