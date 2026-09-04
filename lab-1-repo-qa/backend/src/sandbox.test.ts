import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveRepoPath } from "./sandbox";

describe("resolveRepoPath", () => {
  const repoRoot = mkdtempSync(path.join(tmpdir(), "lab1-repo-"));

  it("resolves a relative file inside the demo repo", () => {
    const resolved = resolveRepoPath(repoRoot, "src/retry.ts");
    expect(resolved).toBe(path.join(repoRoot, "src/retry.ts"));
  });

  it("rejects parent-directory escape", () => {
    expect(() => resolveRepoPath(repoRoot, "../secret.txt")).toThrow(
      /outside the demo repo/,
    );
  });

  it("rejects an absolute path outside the repo", () => {
    expect(() => resolveRepoPath(repoRoot, "/etc/passwd")).toThrow(
      /outside the demo repo/,
    );
  });
});
