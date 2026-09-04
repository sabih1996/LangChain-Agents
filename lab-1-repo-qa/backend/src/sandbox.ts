import * as path from "node:path";

/**
 * Keep every tool path inside `repoRoot`.
 * `path.relative` going `..` means the model tried to walk out of the lab repo.
 */
export function resolveRepoPath(repoRoot: string, requestedPath: string): string {
  const root = path.resolve(repoRoot);
  const candidate = path.resolve(root, requestedPath);
  const relative = path.relative(root, candidate);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path "${requestedPath}" is outside the demo repo.`);
  }

  return candidate;
}
