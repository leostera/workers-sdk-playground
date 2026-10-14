import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { test } from "node:test";

const exec = promisify(execFile);
const sdkDir = process.env.WORKERS_SDK_DIR;
if (!sdkDir) throw new Error("Run npm test to install and build the SDK first");

const { Miniflare } = await import(
  pathToFileURL(path.join(sdkDir, "packages/miniflare/dist/src/index.js")).href
);

async function git(cwd, args, token) {
  const env = {
    ...process.env,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_TERMINAL_PROMPT: "0",
    GIT_AUTHOR_NAME: "Playground",
    GIT_AUTHOR_EMAIL: "playground@example.invalid",
    GIT_COMMITTER_NAME: "Playground",
    GIT_COMMITTER_EMAIL: "playground@example.invalid",
  };
  if (token) {
    env.GIT_CONFIG_COUNT = "1";
    env.GIT_CONFIG_KEY_0 = "http.extraHeader";
    env.GIT_CONFIG_VALUE_0 = `Authorization: Bearer ${token}`;
  }
  await exec("git", args, { cwd, env });
}

test("local Artifacts accepts a Git push and exposes the file through the binding", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "artifacts-playground-"));
  const mf = new Miniflare({
    cf: false,
    workers: [{
      config: {
        name: "playground",
        compatibilityDate: "2026-10-14",
        env: {
          REPOS: { type: "artifacts", namespace: "playground", dev: { remote: false } },
        },
        manifest: {
          mainModule: "index.mjs",
          modulesRoot: directory,
          modules: {
            "index.mjs": {
              type: "esm",
              contents: "export default { fetch() { return new Response('ok'); } };",
            },
          },
        },
      },
    }],
  });
  t.after(async () => {
    await mf.dispose();
    await rm(directory, { recursive: true, force: true });
  });

  const { REPOS } = await mf.getBindings("playground");
  const { remote, token } = await REPOS.create("demo");
  assert.equal(new URL(remote).hostname, "127.0.0.1");

  await git(directory, ["init", "--initial-branch=main", "."]);
  await writeFile(path.join(directory, "hello.txt"), "Hello from local Artifacts!\n");
  await git(directory, ["add", "hello.txt"]);
  await git(directory, ["commit", "-m", "add example file"]);
  await git(directory, ["push", remote, "main"], token);

  const repo = await REPOS.get("demo");
  const file = await repo.readFile({ ref: "main", path: "hello.txt" });
  assert.equal(await file.text(), "Hello from local Artifacts!\n");
  assert.equal((await REPOS.list()).total, 1);
});
