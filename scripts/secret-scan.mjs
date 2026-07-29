import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
]);
const secretPatterns = [
  /\bAKIA[0-9A-Z]{16}\b/,
  /-----BEGIN [A-Z ]+ PRIVATE KEY-----/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\b(api[_-]?key|client[_-]?secret|password|token)\s*[:=]\s*["'][^"']{16,}["']/i,
];

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) {
      continue;
    }

    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await filesIn(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

const findings = [];
for (const file of await filesIn(root)) {
  let contents;
  try {
    contents = await readFile(file, "utf8");
  } catch {
    continue;
  }

  if (secretPatterns.some((pattern) => pattern.test(contents))) {
    findings.push(relative(root, file));
  }
}

if (findings.length > 0) {
  console.error(`Potential secret material found in: ${findings.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("Secret scan passed: no credential patterns found.");
}
