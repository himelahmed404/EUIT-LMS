// Runs every check in turn: node tools/check/run.mjs (or npm run check). Exit code 1 if any fail.
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
let failed = false;
for (const name of ["links", "pages", "states", "flows"]) {
  console.log(`\n=== ${name} ===`);
  const r = spawnSync(process.execPath, [path.join(here, name + ".mjs")], { stdio: "inherit" });
  if (r.status !== 0) failed = true;
}
console.log(failed ? "\nSome checks failed." : "\nEverything passed.");
process.exit(failed ? 1 : 0);
