import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createRepoTools } from "./tools";

function fixtureRepo(): string {
  const root = mkdtempSync(path.join(tmpdir(), "lab1-tools-"));
  mkdirSync(path.join(root, "src"));
  writeFileSync(
    path.join(root, "src/retry.ts"),
    "export async function withRetry(fn: () => Promise<void>, times = 3) {\n  // retry helper\n}\n",
  );
  writeFileSync(path.join(root, "README.md"), "# Demo\n");
  return root;
}

describe("createRepoTools", () => {
  it("lists files under a directory", async () => {
    const tools = createRepoTools(fixtureRepo());
    const listDir = tools.find((t) => t.name === "list_dir");
    const result = await listDir!.invoke({ path: "." });
    expect(String(result)).toContain("src");
    expect(String(result)).toContain("README.md");
  });

  it("reads a file", async () => {
    const tools = createRepoTools(fixtureRepo());
    const readFile = tools.find((t) => t.name === "read_file");
    const result = await readFile!.invoke({ path: "src/retry.ts" });
    expect(String(result)).toContain("withRetry");
  });

  it("greps for a symbol", async () => {
    const tools = createRepoTools(fixtureRepo());
    const grep = tools.find((t) => t.name === "grep");
    const result = await grep!.invoke({ query: "withRetry" });
    expect(String(result)).toMatch(/src\/retry\.ts:\d+:/);
  });

  it("returns an error string when the path escapes the repo", async () => {
    const tools = createRepoTools(fixtureRepo());
    const readFile = tools.find((t) => t.name === "read_file");
    const result = await readFile!.invoke({ path: "../secret.txt" });
    expect(String(result)).toMatch(/outside the demo repo/);
  });
});
