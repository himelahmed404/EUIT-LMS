// Links: every relative href/src points at a file, and every #anchor exists on its page.
import fs from "fs";
import path from "path";
import { ROOT, pages, report, done } from "./lib.mjs";

let broken = [];
let placeholders = 0;
for (const page of pages()) {
  const file = path.join(ROOT, page);
  const html = fs.readFileSync(file, "utf8");
  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(url)) continue;
    if (url === "#") {
      placeholders++;
      continue;
    }
    const [target, hash] = url.split("#");
    const dest = target ? path.resolve(path.dirname(file), target) : file;
    if (!fs.existsSync(dest)) {
      broken.push(`${page} → ${url}`);
      continue;
    }
    if (hash && dest.endsWith(".html") && !fs.readFileSync(dest, "utf8").includes(`id="${hash}"`))
      broken.push(`${page} → ${url} (no #${hash})`);
  }
}
report("no broken links or anchors", broken.length === 0, broken.slice(0, 10).join("; "));
console.log(`(${placeholders} links are still "#": actions with no page yet, listed in docs/PAGES.md)`);
done();
