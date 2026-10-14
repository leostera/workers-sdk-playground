export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/health" && request.method === "GET") {
      return new Response("artifacts-playground-ready");
    }
    if (pathname === "/create" && request.method === "POST") {
      const created = await env.ARTIFACTS.create("demo");
      return Response.json({ remote: created.remote, token: created.token });
    }
    if (pathname === "/read" && request.method === "GET") {
      const repo = await env.ARTIFACTS.get("demo");
      const file = await repo.readFile({ ref: "main", path: "hello.txt" });
      return new Response(file);
    }
    return new Response("Not found", { status: 404 });
  },
};
