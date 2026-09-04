import { getRepoQaAgent } from "@agents/lab-1-repo-qa";

export const runtime = "nodejs";

function chunkText(chunk: unknown): string {
  if (!chunk || typeof chunk !== "object") {
    return "";
  }
  const content = (chunk as { content?: unknown }).content;
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }
        if (part && typeof part === "object" && "text" in part) {
          return String((part as { text?: string }).text ?? "");
        }
        return "";
      })
      .join("");
  }
  return "";
}

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error:
          "Missing API key. Copy frontend/.env.example to frontend/.env.local and set OPENAI_API_KEY.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json()) as {
    message?: string;
    threadId?: string;
  };
  const message = body.message?.trim();
  const threadId = body.threadId ?? "lab1-default";

  if (!message) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  const agent = getRepoQaAgent();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        const events = agent.streamEvents(
          { messages: [{ role: "user", content: message }] },
          {
            version: "v2",
            signal: request.signal,
            configurable: { thread_id: threadId },
          },
        );

        for await (const event of events) {
          if (event.event === "on_chat_model_stream") {
            const text = chunkText(event.data?.chunk);
            if (text) {
              send({ type: "token", text });
            }
          }
          if (event.event === "on_tool_start") {
            send({ type: "tool", name: event.name, status: "start" });
          }
          if (event.event === "on_tool_end") {
            send({ type: "tool", name: event.name, status: "end" });
          }
        }
        send({ type: "done" });
      } catch (error) {
        const text = error instanceof Error ? error.message : String(error);
        send({ type: "error", error: text });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
