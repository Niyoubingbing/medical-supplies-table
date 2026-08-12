// Push project to GitHub via Git Data API (sandbox-safe)
// Usage: GITHUB_TOKEN=xxx node push-to-github.mjs
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, sep, posix } from "node:path";

const TOKEN = process.env.GITHUB_TOKEN || process.env.Github_Token;
if (!TOKEN) {
  console.error("ERROR: GITHUB_TOKEN env var not set");
  process.exit(1);
}

const REPO_NAME = "medical-supplies-table";
const REPO_DESC = "本地存储的医用耗材录入表 — Next.js + Tailwind + html2canvas";
const IS_PRIVATE = false; // public
const BRANCH = "main";
const COMMIT_MSG = "feat: 医用耗材录入表（衬线字体 / 行内编辑 / 一键导出截图）";

const ROOT = resolve(process.cwd());
const API = "https://api.github.com";

function authHeaders() {
  return {
    Authorization: `Bearer ${TOKEN}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "workbuddy-deploy",
  };
}

async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GitHub API ${method} ${path} -> ${res.status}\n${text}`);
  }
  return text ? JSON.parse(text) : null;
}

async function collectFiles(dir, base = dir, out = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = resolve(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === ".git" || e.name === "out" || e.name === ".vercel") continue;
      await collectFiles(full, base, out);
    } else if (e.isFile()) {
      // Skip large/binary build artifacts
      if (e.name === "package-lock.json") continue;
      const s = await stat(full);
      if (s.size > 5 * 1024 * 1024) {
        console.warn(`Skipping large file: ${full} (${s.size} bytes)`);
        continue;
      }
      // Compute path relative to process.cwd() — Windows-safe
      let rel = relative(process.cwd(), full);
      if (/^[A-Za-z]:/.test(rel)) {
        throw new Error(`Absolute path leaked: ${rel} (from ${full})`);
      }
      // Normalize to POSIX-style forward slashes for GitHub
      rel = rel.split(sep).join(posix.sep);
      out.push({ abs: full, rel });
    }
  }
  return out;
}

async function main() {
  console.log("→ Collecting files…");
  const files = await collectFiles(ROOT);
  console.log(`  ${files.length} files to push`);
  for (const f of files) console.log("   •", f.rel);

  // 1. Ensure repository exists
  console.log("→ Ensuring repo exists…");
  // First check the authenticated user's login
  const me = await api("GET", "/user");
  const owner = me.login;
  let repo;
  try {
    repo = await api("GET", `/repos/${owner}/${REPO_NAME}`);
    console.log(`  Repo already exists: ${repo.html_url}`);
  } catch (e) {
    if (String(e.message).includes("404")) {
      repo = await api("POST", "/user/repos", {
        name: REPO_NAME,
        description: REPO_DESC,
        private: IS_PRIVATE,
        auto_init: false,
      });
      console.log(`  Created repo: ${repo.html_url}`);
    } else throw e;
  }

  // 2. Get current HEAD sha (if any)
  let baseSha = null;
  try {
    const ref = await api("GET", `/repos/${owner}/${REPO_NAME}/git/ref/heads/${BRANCH}`);
    baseSha = ref.object.sha;
  } catch (e) {
    const msg = String(e.message);
    // 404 = branch does not exist; 409 = repo is empty (no commits yet)
    if (!msg.includes("404") && !msg.includes("409")) throw e;
    console.log("  Branch does not exist yet — will initialize");
  }

  // If repo is empty, initialize it via Contents API (Git Data API cannot write to empty repos)
  if (!baseSha) {
    console.log("→ Initializing empty repo with .gitignore…");
    await api("PUT", `/repos/${owner}/${REPO_NAME}/contents/.gitignore`, {
      message: "init",
      content: Buffer.from("node_modules\n.next\n.vercel\n").toString("base64"),
    });
    const ref = await api("GET", `/repos/${owner}/${REPO_NAME}/git/ref/heads/${BRANCH}`);
    baseSha = ref.object.sha;
    console.log("  Repo initialized, baseSha:", baseSha);
  }

  let parentShas = [];
  if (baseSha) {
    const baseCommit = await api("GET", `/repos/${owner}/${REPO_NAME}/git/commits/${baseSha}`);
    parentShas = [baseCommit.sha];
  }

  // 3. Create blobs
  console.log("→ Creating blobs…");
  const treeEntries = [];
  for (const f of files) {
    const content = await readFile(f.abs, "utf8");
    const blob = await api("POST", `/repos/${owner}/${REPO_NAME}/git/blobs`, {
      encoding: "utf-8",
      content,
    });
    treeEntries.push({
      path: f.rel,
      mode: "100644",
      type: "blob",
      sha: blob.sha,
    });
  }

  // 4. Create tree
  console.log("→ Creating tree…");
  const tree = await api("POST", `/repos/${owner}/${REPO_NAME}/git/trees`, {
    ...(baseSha ? { base_tree: baseSha } : {}),
    tree: treeEntries,
  });

  // 5. Create commit
  console.log("→ Creating commit…");
  const commit = await api("POST", `/repos/${owner}/${REPO_NAME}/git/commits`, {
    message: COMMIT_MSG,
    tree: tree.sha,
    parents: parentShas,
  });

  // 6. Create / update ref
  console.log("→ Updating ref…");
  try {
    await api("PATCH", `/repos/${owner}/${REPO_NAME}/git/refs/heads/${BRANCH}`, {
      sha: commit.sha,
      force: true,
    });
  } catch (e) {
    if (String(e.message).includes("404")) {
      await api("POST", `/repos/${owner}/${REPO_NAME}/git/refs`, {
        ref: `refs/heads/${BRANCH}`,
        sha: commit.sha,
      });
    } else throw e;
  }

  console.log("\n✓ Push complete");
  console.log("  Repo:", repo.html_url);
  console.log("  Commit:", commit.html_url);
}

main().catch((e) => {
  console.error("\n✗ Push failed:", e.message);
  process.exit(1);
});
