import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const exec = promisify(execFile);
const baseUrl = process.env.PLAYGROUND_URL ?? "http://127.0.0.1:8787";

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

test("cf dev serves a local Artifacts binding and accepts Git pushes", async (t) => {
  let health;
  try {
    health = await fetch(`${baseUrl}/health`);
  } catch {
    throw new Error("Start `bun run cf dev` in another terminal before running `bun test`");
  }
  if (!health.ok || (await health.text()) !== "artifacts-playground-ready") {
    throw new Error(`The playground is not running at ${baseUrl}. Check the URL printed by cf dev.`);
  }

  const directory = await mkdtemp(path.join(tmpdir(), "artifacts-playground-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  const name = `demo-${crypto.randomUUID().slice(0, 8)}`;
  const response = await fetch(`${baseUrl}/create`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  assert.equal(response.status, 200, "Repository creation failed");
  const { remote, token } = await response.json();
  assert.equal(new URL(remote).hostname, "127.0.0.1");

  await git(directory, ["init", "--initial-branch=main", "."]);
  await writeFile(path.join(directory, "hello.txt"), "Hello from local Artifacts!\n");
  await git(directory, ["add", "hello.txt"]);
  await git(directory, ["commit", "-m", "add example file"]);
  await git(directory, ["push", remote, "main"], token);

  const file = await fetch(`${baseUrl}/read?name=${name}`);
  assert.equal(file.status, 200);
  assert.equal(await file.text(), "Hello from local Artifacts!\n");
});
