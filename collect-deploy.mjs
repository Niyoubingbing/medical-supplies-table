import { readFileSync, readdirSync, statSync } from "fs";
import { resolve, relative, sep, posix } from "path";

const SKIP_DIRS = new Set(["node_modules", ".next", ".git", ".vercel", "out"]);
const SKIP_FILES = new Set([
  "package-lock.json",
  "tsconfig.tsbuildinfo",
  "next-env.d.ts",
  "push-to-github.mjs",
  "deploy-files.json",
  "collect-deploy.mjs",
]);

const out = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) {
      if (name === "." || name === "..") continue;
    }
    const full = resolve(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      walk(full);
    } else if (st.isFile()) {
      if (SKIP_FILES.has(name)) continue;
      const rel = relative(process.cwd(), full).split(sep).join(posix.sep);
      out.push({ file: rel, data: readFileSync(full, "utf8") });
    }
  }
}
walk(process.cwd());
console.log(JSON.stringify({ files: out }));
