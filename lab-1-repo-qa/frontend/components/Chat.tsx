"use client";

import { FormEvent, useMemo, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  tools: string[];
};

function newThreadId(): string {
  return crypto.randomUUID();
}

export function Chat() {
  const threadId = useMemo(newThreadId, []);
  const [input, setInput] = useState("Where is the retry logic?");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy) {
      return;
    }

    setBusy(true);
    setError(null);
    setMessages((current) => [
      ...current,
      { role: "user", content: text, tools: [] },
      { role: "assistant", content: "", tools: [] },
    ]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, threadId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.replace(/^data: /, "");
          if (!line) {
            continue;
          }
          const event = JSON.parse(line) as {
            type: string;
            text?: string;
            name?: string;
            status?: string;
            error?: string;
          };

          if (event.type === "token" && event.text) {
            setMessages((current) => {
              const next = [...current];
              const last = next[next.length - 1];
              next[next.length - 1] = {
                ...last,
                content: last.content + event.text,
              };
              return next;
            });
          }

          if (event.type === "tool" && event.name && event.status === "start") {
            setMessages((current) => {
              const next = [...current];
              const last = next[next.length - 1];
              if (!last.tools.includes(event.name!)) {
                next[next.length - 1] = {
                  ...last,
                  tools: [...last.tools, event.name!],
                };
              }
              return next;
            });
          }

          if (event.type === "error") {
            throw new Error(event.error ?? "Agent error");
          }
        }
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="chat">
      <div className="messages">
        {messages.length === 0 ? (
          <p className="lede">Ask about retry, timeouts, or HTTP errors in demo-repo.</p>
        ) : null}
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
            <strong>{message.role === "user" ? "You" : "Agent"}</strong>
            <div>{message.content || (busy ? "…" : "")}</div>
            {message.tools.length > 0 ? (
              <div className="tools">
                {message.tools.map((name) => (
                  <span key={name} className="chip">
                    {name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {error ? <p className="error">{error}</p> : null}
      <form onSubmit={onSubmit}>
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about the demo repo"
          aria-label="Question about the demo repo"
          disabled={busy}
        />
        <button type="submit" disabled={busy}>
          {busy ? "Running" : "Ask"}
        </button>
      </form>
    </section>
  );
}
