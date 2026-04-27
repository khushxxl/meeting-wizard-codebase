// Zips ../meeting-wizard-ext into public/described-extension.zip so the
// landing page can serve a one-click download. Runs before `next build` and
// `next dev` via npm script hooks. Skips silently if the source folder is
// missing (e.g. when the web app is deployed from its own repo).
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const extDir = resolve(here, "../../meeting-wizard-ext");
const publicDir = resolve(here, "../public");
const outFile = join(publicDir, "described-extension.zip");

if (!existsSync(extDir)) {
  console.log(`[zip-extension] skip: ${extDir} not found`);
  process.exit(0);
}

mkdirSync(publicDir, { recursive: true });
if (existsSync(outFile)) rmSync(outFile);

// Zip from inside the ext dir so paths in the archive are relative.
execSync(`zip -rq "${outFile}" . -x "*.DS_Store" "*/.DS_Store"`, {
  cwd: extDir,
  stdio: "inherit",
});

console.log(`[zip-extension] wrote ${outFile}`);
