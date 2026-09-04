import { createAgent, createMiddleware, ToolMessage } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { createRepoTools } from "./tools";

const toolErrors = createMiddleware({
  name: "ToolErrors",
  wrapToolCall: async (request, handler) => {
    try {
      return await handler(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return new ToolMessage({
        content: `Tool error: ${message}`,
        tool_call_id: request.toolCall.id ?? "",
      });
    }
  },
});

const SYSTEM_PROMPT = `You are a repo Q&A assistant for a small local TypeScript demo project.

Rules:
- Use list_dir, read_file, and grep to inspect the repo before answering.
- Never guess file contents.
- Cite paths (and line numbers from grep when you have them) in every answer.
- You cannot write, delete, or run shell commands. This lab is read-only.
`;

export type CreateRepoQaAgentOptions = {
  repoRoot: string;
  model?: string;
  checkpointer?: MemorySaver;
};

export function createRepoQaAgent(options: CreateRepoQaAgentOptions) {
  const model = options.model ?? process.env.LANGCHAIN_MODEL ?? "openai:gpt-4o-mini";

  return createAgent({
    model,
    tools: createRepoTools(options.repoRoot),
    systemPrompt: SYSTEM_PROMPT,
    middleware: [toolErrors],
    checkpointer: options.checkpointer ?? new MemorySaver(),
  });
}
