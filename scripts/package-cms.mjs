// Splits dist/ into Curious Reader CMS ZIPs (third-party spec §5, Layout A):
//   release/<engine>-core.zip            engine tier: index.html at root, no lang/
//   release/<engine>-lang-<code>.zip     lang tier: lang/<code>/** only
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join, relative, sep } from "node:path";
import { zipSync } from "fflate";

const DIST = "dist";
const OUT = "release";
const { engineSlug } = JSON.parse(readFileSync("cms.config.json", "utf8"));

const fail = (message) => {
  console.error(`package-cms: ${message}`);
  process.exit(1);
};

if (!existsSync(join(DIST, "index.html"))) {
  fail("dist/index.html not found — run `npm run build` first.");
}

const files = readdirSync(DIST, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => {
    const abs = join(entry.parentPath, entry.name);
    return { abs, rel: relative(DIST, abs).split(sep).join("/") };
  });

// Offline compliance audit (spec §2.1 / §7a).
const errors = [];
for (const { abs, rel } of files) {
  if (rel.endsWith(".map")) errors.push(`${rel}: source maps must not ship`);
  if (!/\.(html|css|js)$/.test(rel)) continue;
  const text = readFileSync(abs, "utf8");
  if (/(?:src|href)=["']\/(?!\/)/.test(text)) {
    errors.push(`${rel}: absolute local src/href ("/...")`);
  }
  if (/url\(\s*["']?\/(?!\/)/.test(text)) {
    errors.push(`${rel}: absolute CSS url(/...)`);
  }
  if (rel === "index.html" && /type=["']module["']/.test(text)) {
    errors.push("index.html: module scripts are blocked on file://");
  }
  if (rel === "index.html" && /<script[^>]+src=["']https?:/.test(text)) {
    errors.push("index.html: external <script src> is forbidden");
  }
}
if (errors.length > 0) fail(`offline audit failed:\n  ${errors.join("\n  ")}`);

const zip = (entries) =>
  zipSync(
    Object.fromEntries(entries.map((f) => [f.rel, readFileSync(f.abs)])),
    { level: 0 },
  );

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const outputs = [];
const write = (name, entries) => {
  writeFileSync(join(OUT, name), zip(entries));
  outputs.push(`${OUT}/${name} (${entries.length} files)`);
};

write(
  `${engineSlug}-core.zip`,
  files.filter((f) => !f.rel.startsWith("lang/")),
);

const langCodes = [
  ...new Set(
    files
      .filter((f) => f.rel.startsWith("lang/"))
      .map((f) => f.rel.split("/")[1]),
  ),
];
if (langCodes.length === 0) fail("no dist/lang/<code>/ directories found.");

for (const code of langCodes) {
  if (!/^[a-z0-9-]+$/.test(code)) fail(`invalid language code "${code}"`);
  write(
    `${engineSlug}-lang-${code}.zip`,
    files.filter((f) => f.rel.startsWith(`lang/${code}/`)),
  );
}

console.log(`package-cms: wrote\n  ${outputs.join("\n  ")}`);
