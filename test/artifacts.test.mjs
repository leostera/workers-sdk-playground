import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { promisify } from "node:util";

const exec = promisify(execFile);

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

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function startDevServer(port) {
  const child = spawn(process.execPath, ["node_modules/cf/bin/cf", "dev", "--port", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  for (const stream of [child.stdout, child.stderr]) {
    stream.on("data", (chunk) => {
      output = (output + chunk.toString()).slice(-16_000);
    });
  }

  const baseUrl = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) break;
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok && (await response.text()) === "artifacts-playground-ready") {
        return { child, baseUrl };
      }
    } catch {
      // The dev server has not opened its port yet.
    }
    await delay(250);
  }
  child.kill("SIGTERM");
  throw new Error(`cf dev did not become ready:\n${output}`);
}

async function stopDevServer(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    delay(5_000),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

test("cf dev serves a local Artifacts binding and accepts Git pushes", async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), "artifacts-playground-"));
  t.after(() => rm(directory, { recursive: true, force: true }));

  const { child, baseUrl } = await startDevServer(await freePort());
  t.after(() => stopDevServer(child));

  const response = await fetch(`${baseUrl}/create`, { method: "POST" });
  assert.equal(response.status, 200, "Repository creation failed");
  const { remote, token } = await response.json();
  assert.equal(new URL(remote).hostname, "127.0.0.1");

  await git(directory, ["init", "--initial-branch=main", "."]);
  await writeFile(path.join(directory, "hello.txt"), "Hello from local Artifacts!\n");
  await git(directory, ["add", "hello.txt"]);
  await git(directory, ["commit", "-m", "add example file"]);
  await git(directory, ["push", remote, "main"], token);

  const file = await fetch(`${baseUrl}/read`);
  assert.equal(file.status, 200);
  assert.equal(await file.text(), "Hello from local Artifacts!\n");
});
