import path from "node:path";
import { fileURLToPath } from "node:url";
import { MemorySaver } from "@langchain/langgraph";
import { createRepoQaAgent } from "./agent";

const checkpointer = new MemorySaver();

export function demoRepoRoot(): string {
  if (process.env.DEMO_REPO_ROOT) {
    return process.env.DEMO_REPO_ROOT;
  }
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../demo-repo");
}

export function getRepoQaAgent() {
  return createRepoQaAgent({
    repoRoot: demoRepoRoot(),
    checkpointer,
  });
}

export { resolveRepoPath } from "./sandbox";
export { createRepoTools } from "./tools";
export { createRepoQaAgent } from "./agent";
