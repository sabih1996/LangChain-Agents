import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { getRepoQaAgent } from "./index";

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) {
    return;
  }
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), ".env.local"));
loadEnvFile(path.resolve(process.cwd(), "../frontend/.env.local"));

const port = Number(process.env.PORT ?? 3001);

const server = createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, demoRepo: "backend/demo-repo" }));
    return;
  }

  if (req.method === "POST" && req.url === "/chat") {
    if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      res.writeHead(503, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error:
            "Missing API key. Add OPENAI_API_KEY to backend/.env.local or frontend/.env.local",
        }),
      );
      return;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}") as {
      message?: string;
      threadId?: string;
    };
    const message = body.message?.trim();
    if (!message) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "message is required" }));
      return;
    }

    try {
      const agent = getRepoQaAgent();
      const result = await agent.invoke(
        { messages: [{ role: "user", content: message }] },
        { configurable: { thread_id: body.threadId ?? "lab1-cli" } },
      );
      const last = result.messages.at(-1);
      const content =
        last && typeof last === "object" && "content" in last
          ? last.content
          : result;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ content }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found. POST /chat or GET /health" }));
});

server.listen(port, () => {
  console.log(`Lab 1 backend listening on http://localhost:${port}`);
  console.log("POST /chat  { \"message\": \"Where is the retry logic?\" }");
});
