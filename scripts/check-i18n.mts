// Bilingual structure gate: the Chinese tree (docs/, root locale) and the
// English tree (docs/en/) must expose exactly the same page set.
//
// VitePress does not fall back to the default locale for a page that exists
// only on one side - it 404s. So a missing translation is a broken link, not a
// degraded page, and this check is the hard gate for that.
import { readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = join(root, "docs");
const enDir = join(docsDir, "en");

/** Markdown pages under `dir`, relative to `dir`, using `/` separators. */
function pages(dir: string, skip: string[] = []): string[] {
    const found: string[] = [];
    const walk = (current: string) => {
        for (const entry of readdirSync(current)) {
            if (entry.startsWith(".") || (current === dir && skip.includes(entry))) continue;
            const path = join(current, entry);
            if (statSync(path).isDirectory()) walk(path);
            else if (entry.endsWith(".md")) found.push(relative(dir, path).split(sep).join("/"));
        }
    };
    walk(dir);
    return found.sort();
}

// The English tree lives *inside* the Chinese one (`docs/en/`), so it has to be
// skipped explicitly or every English page would be counted twice.
const zh = pages(docsDir, ["en"]);
const en = pages(enDir);
const onlyZh = zh.filter((page) => !en.includes(page));
const onlyEn = en.filter((page) => !zh.includes(page));

if (zh.length === 0) {
    console.error("check-i18n: no Chinese pages found under docs/");
    process.exit(1);
}

if (onlyZh.length || onlyEn.length) {
    console.error(`check-i18n: the two locales are out of sync (zh=${zh.length}, en=${en.length})`);
    for (const page of onlyZh) console.error(`  missing in en/: ${page}`);
    for (const page of onlyEn) console.error(`  missing in docs/: ${page}`);
    process.exit(1);
}

console.log(`check-i18n: ok (${zh.length} pages x 2 locales)`);
