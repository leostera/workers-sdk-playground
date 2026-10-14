# Workers SDK Artifacts playground

Test the Artifacts simulator through a real `cf dev` Worker. This uses the [Wrangler preview from workers-sdk PR #16186](https://github.com/cloudflare/workers-sdk/pull/16186), pinned to commit `045645085287874ac2f44606dfddd5718c78df1c` via the [documented PR preview packages](https://github.com/cloudflare/workers-sdk/blob/main/CONTRIBUTING.md#pr-previews).

Requires Node.js 22+, Git 2.32+, and npm. No Cloudflare credentials are needed.

```sh
npm i
npm test
```

The test starts `cf dev` with the Artifacts binding from `cloudflare.config.ts` (`dev: { remote: false }`), creates a repo through the Worker, pushes a commit to its local Git remote, and reads the file back through the Worker. To explore interactively, run `npm run dev`.

The Worker is for local development only. Do not deploy its unauthenticated test endpoints: `/create` returns a repository token. The test does not contact deployed Artifacts or establish parity with that service.
