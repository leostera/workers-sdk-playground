export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    if (pathname === "/health" && request.method === "GET") {
      return new Response("artifacts-playground-ready");
    }
    if (pathname === "/create" && request.method === "POST") {
      const { name } = await request.json() as { name: string };
      const created = await env.ARTIFACTS.create(name);
      return Response.json({ remote: created.remote, token: created.token });
    }
    if (pathname === "/read" && request.method === "GET") {
      const name = url.searchParams.get("name");
      if (!name) return new Response("Missing repository name", { status: 400 });
      const repo = await env.ARTIFACTS.get(name);
      const file = await repo.readFile({ ref: "main", path: "hello.txt" });
      return new Response(file);
    }
    return new Response("Not found", { status: 404 });
  },
};
