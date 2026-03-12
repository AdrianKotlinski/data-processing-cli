import fs from "fs/promises";
import path from "path";
import resolvePath from "./utils/pathResolver.js";

export function up(cwd) {
  const parent = path.dirname(cwd);
  return parent === cwd ? cwd : parent;
}

export async function cd(cwd, target) {
  const resolved = resolvePath(cwd, target);
  const stat = await fs.stat(resolved);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${resolved}`);
  }
  return resolved;
}

export async function ls(cwd) {
  const entries = await fs.readdir(cwd, { withFileTypes: true });

  const dirs = entries
    .filter((e) => e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const files = entries
    .filter((e) => !e.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name));

  const sorted = [...dirs, ...files];

  if (sorted.length === 0) {
    return "(empty directory)";
  }

  const maxLen = Math.max(...sorted.map((e) => e.name.length));
  const lines = sorted.map((e) => {
    const tag = e.isDirectory() ? "[folder]" : "[file]  ";
    return `${e.name.padEnd(maxLen + 2)}${tag}`;
  });
  return lines.join("\n");
}
