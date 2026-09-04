import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { tool } from "langchain";
import { z } from "zod";
import { resolveRepoPath } from "./sandbox";

function safeCall(run: () => string): string {
  try {
    return run();
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

function walkFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

export function createRepoTools(repoRoot: string) {
  const listDir = tool(
    ({ path: requestedPath }: { path: string }) =>
      safeCall(() => {
        const dir = resolveRepoPath(repoRoot, requestedPath);
        const names = readdirSync(dir);
        return names.join("\n") || "(empty)";
      }),
    {
      name: "list_dir",
      description:
        "List files and folders at a path inside the demo repo. Use '.' for the repo root.",
      schema: z.object({
        path: z
          .string()
          .describe("Relative directory path from the demo repo root"),
      }),
    },
  );

  const readFile = tool(
    ({ path: requestedPath }: { path: string }) =>
      safeCall(() => {
        const file = resolveRepoPath(repoRoot, requestedPath);
        if (statSync(file).isDirectory()) {
          return "That path is a directory. Use list_dir instead.";
        }
        const contents = readFileSync(file, "utf8");
        const max = 12_000;
        if (contents.length > max) {
          return `${contents.slice(0, max)}\n\n[truncated]`;
        }
        return contents;
      }),
    {
      name: "read_file",
      description: "Read a text file from the demo repo. Paths are relative to the repo root.",
      schema: z.object({
        path: z.string().describe("Relative file path, e.g. src/retry.ts"),
      }),
    },
  );

  const grep = tool(
    ({ query }: { query: string }) =>
      safeCall(() => {
        const root = resolveRepoPath(repoRoot, ".");
        const hits: string[] = [];
        for (const file of walkFiles(root)) {
          const text = readFileSync(file, "utf8");
          const lines = text.split("\n");
          lines.forEach((line, index) => {
            if (line.includes(query)) {
              const rel = path.relative(root, file);
              hits.push(`${rel}:${index + 1}:${line.trim()}`);
            }
          });
        }
        return hits.length > 0 ? hits.slice(0, 50).join("\n") : `No matches for "${query}".`;
      }),
    {
      name: "grep",
      description:
        "Search the demo repo for a literal string. Returns path:line:content matches.",
      schema: z.object({
        query: z.string().describe("Exact text to search for"),
      }),
    },
  );

  return [listDir, readFile, grep];
}
