# Workers SDK Artifacts playground

Test the Artifacts simulator through `cf dev`. This uses the [Wrangler preview from workers-sdk PR #16186](https://github.com/cloudflare/workers-sdk/pull/16186), pinned to commit `045645085287874ac2f44606dfddd5718c78df1c` via the [documented PR preview packages](https://github.com/cloudflare/workers-sdk/blob/main/CONTRIBUTING.md#pr-previews).

Requires Node.js 22+, Bun, Git 2.32+, and npm. No Cloudflare credentials are needed. After `npm i`, run these in **separate terminals**:

```sh
bun run cf dev
```

```sh
bun test
```

The test finds the running Worker on a local port (including 8789 if 8787 is busy). It creates a repository through the Artifacts binding configured in `cloudflare.config.ts` with `dev: { remote: false }`, pushes a commit to its local Git remote, and reads the file back. The test does not start or stop `cf dev`. Set `PLAYGROUND_URL` if the server uses a port outside 8787–8806.

The Worker is for local development only. Do not deploy its unauthenticated test endpoints: `/create` returns a repository token. The test does not contact deployed Artifacts or establish parity with that service.
