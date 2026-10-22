// Talks to the Curious Reader CMS MCP endpoint (third-party spec §8) with a personal token.
//
//   npm run cms -- list                          engine slugs + full inventory
//   npm run cms -- manifests                     all manifests (id, dev-only, entry count, name)
//   npm run cms -- manifest [name]               one manifest (default: cms.config.json devManifest)
//   npm run cms -- reserve --confirm-permanent   reserve cms.config.json engineSlug (irreversible)
//   npm run cms -- upload --init [--notes "…"]   first upload: engine (+title/urlTemplate) + lang packs
//   npm run cms -- upload [--notes "…"]          new versions of engine + lang packs
//   npm run cms -- status                        our inventory items + whether they're in devManifest
//   npm run cms -- assign                        add our tiles to devManifest (needs an "edit" token)
//   npm run cms -- tools                         server tool schemas
//
// The token is read from CRMCP_TOKEN (put it in the git-ignored .env.local file).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";

const config = JSON.parse(readFileSync("cms.config.json", "utf8"));
const RELEASE = "release";
const MAX_INLINE_BYTES = 9 * 1024 * 1024; // spec §8.1: inline base64 is fine up to ~10 MB
const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    init: { type: "boolean", default: false },
    notes: { type: "string" },
    "confirm-permanent": { type: "boolean", default: false },
  },
});

const fail = (message) => {
  console.error(`cms: ${message}`);
  process.exit(1);
};

const token = process.env.CRMCP_TOKEN?.trim();
if (!token) {
  fail(
    "CRMCP_TOKEN is not set. Copy .env.example to .env.local and paste your crmcp_ token there.",
  );
}
if (!config.mcpUrl.startsWith("https://")) fail("mcpUrl must use https://");

let nextId = 1;
let protocolVersion;

async function rpc(method, params) {
  const response = await fetch(config.mcpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${token}`,
      ...(protocolVersion ? { "MCP-Protocol-Version": protocolVersion } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  });
  const body = await response.text();
  if (!response.ok)
    fail(`${method} → HTTP ${response.status}: ${body.slice(0, 500)}`);

  // Streamable HTTP may answer with plain JSON or a single-message SSE stream.
  const json = (response.headers.get("content-type") ?? "").includes(
    "text/event-stream",
  )
    ? body
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("")
    : body;
  const message = JSON.parse(json);
  if (message.error) fail(`${method} → ${message.error.message}`);
  return message.result;
}

async function ensureInitialized() {
  if (protocolVersion) return;
  const init = await rpc("initialize", {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: `${config.engineSlug}-cms-script`, version: "1.0.0" },
  });
  protocolVersion = init.protocolVersion;
}

async function callTool(name, args, { quiet = false } = {}) {
  await ensureInitialized();
  const result = await rpc("tools/call", { name, arguments: args });
  const text = (result.content ?? [])
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
  if (result.isError) fail(`${name} failed: ${text}`);
  if (!quiet) console.log(`\n== ${name} ==\n${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function readZip(fileName) {
  const path = join(RELEASE, fileName);
  if (!existsSync(path))
    fail(`${path} not found — run \`npm run package:cms\` first.`);
  const bytes = readFileSync(path);
  if (bytes.length > MAX_INLINE_BYTES) {
    fail(
      `${path} is ${bytes.length} bytes; add chunked upload (spec §8.1a) before uploading it.`,
    );
  }
  return bytes.toString("base64");
}

function readIcon(langCode) {
  const path = join(config.iconsDir, `${langCode}.png`);
  if (!existsSync(path)) {
    console.warn(
      `cms: no icon at ${path}; the tile needs a true-PNG square icon before it ships.`,
    );
    return undefined;
  }
  const bytes = readFileSync(path);
  if (!bytes.subarray(0, 8).equals(PNG_SIGNATURE))
    fail(`${path} is not a true PNG file.`);
  return bytes.toString("base64");
}

const versionNotes = values.notes ? { versionNotes: values.notes } : {};

async function findManifest(name) {
  const manifests = await callTool("list_manifests", {}, { quiet: true });
  const manifest = manifests.find((m) => m.name === name);
  if (!manifest)
    fail(`manifest "${name}" not found (see \`npm run cms -- manifests\`).`);
  return manifest;
}

function releaseLangFiles() {
  const prefix = `${config.engineSlug}-lang-`;
  return readdirSync(RELEASE)
    .filter((name) => name.startsWith(prefix) && name.endsWith(".zip"))
    .map((fileName) => ({
      fileName,
      langCode: fileName.slice(prefix.length, -".zip".length),
    }));
}

const isOurEntry = (entry, langCode) =>
  entry.engineSlug === config.engineSlug &&
  !entry.bookSlug &&
  entry.langCode === langCode;

// The upload response shape isn't documented; look for the field anywhere in it.
function findField(value, key) {
  if (!value || typeof value !== "object") return undefined;
  if (key in value) return value[key];
  for (const child of Object.values(value)) {
    const found = findField(child, key);
    if (found !== undefined) return found;
  }
  return undefined;
}

switch (positionals[0]) {
  case "tools": {
    await ensureInitialized();
    const { tools } = await rpc("tools/list", {});
    for (const tool of tools) {
      console.log(`\n== ${tool.name} ==\n${tool.description ?? ""}`);
      console.log(JSON.stringify(tool.inputSchema, null, 2));
    }
    break;
  }

  case "manifests": {
    const manifests = await callTool("list_manifests", {}, { quiet: true });
    for (const m of manifests) {
      console.log(
        `${m.id}  ${m.devOnly ? "dev-only" : "        "}  ${String(m.entryCount).padStart(3)} entries  ${m.name}`,
      );
    }
    break;
  }

  case "manifest": {
    const { id } = await findManifest(positionals[1] ?? config.devManifest);
    await callTool("get_manifest", { manifestId: id });
    break;
  }

  case "list":
    await callTool("list_engine_slugs", {});
    await callTool("list_inventory", {});
    break;

  case "reserve":
    if (!values["confirm-permanent"]) {
      fail(
        `reserving "${config.engineSlug}" is permanent and global (it can never be renamed or reused). ` +
          "Re-run with --confirm-permanent once the slug is agreed with Curious Learning.",
      );
    }
    await callTool("create_engine_slug", {
      slug: config.engineSlug,
      confirmed: true,
    });
    break;

  case "upload": {
    const devManifest = await findManifest(config.devManifest);
    const engineFile = `${config.engineSlug}-core.zip`;
    await callTool("upload_core_game", {
      engineSlug: config.engineSlug,
      filename: engineFile,
      zipBase64: readZip(engineFile),
      ...(values.init
        ? {
            title: config.title,
            urlTemplate: config.urlTemplate,
            hasCoreLevel: config.hasCoreLevel,
          }
        : {}),
      ...versionNotes,
    });

    const notInDevManifest = [];
    for (const { fileName, langCode } of releaseLangFiles()) {
      const iconBase64 = readIcon(langCode);
      const response = await callTool("upload_language_pack", {
        engineSlug: config.engineSlug,
        langCode,
        filename: fileName,
        zipBase64: readZip(fileName),
        ...(iconBase64 ? { iconBase64 } : {}),
        ...versionNotes,
      });
      if (
        !findField(response, "autoAdded") ||
        findField(response, "autoAddManifestId") !== devManifest.id
      ) {
        notInDevManifest.push(langCode);
      }
    }

    console.log("\ncms: uploaded to the development channel.");
    if (notInDevManifest.length > 0) {
      console.warn(
        `cms: ${notInDevManifest.join(", ")} was NOT auto-added to "${config.devManifest}". ` +
          "Run `npm run cms -- status` to confirm, then ask a CMS admin to add it " +
          "(or set your auto-add manifest), or run `npm run cms -- assign` with an edit-scope token.",
      );
    } else {
      console.log(
        `cms: auto-added to "${config.devManifest}". Next: preview it in the CMS player.`,
      );
    }
    break;
  }

  case "status": {
    const inventory = await callTool("list_inventory", {}, { quiet: true });
    const ours = inventory.filter(
      (item) => item.engineSlug === config.engineSlug,
    );
    console.log(`Inventory for "${config.engineSlug}":`);
    if (ours.length === 0) console.log("  (nothing uploaded yet)");
    for (const item of ours) {
      console.log(
        `  ${item.id}  ${item.kind.padEnd(6)} ${(item.langCode ?? "").padEnd(10)} v${item.version}  ${item.status}`,
      );
    }

    const { id } = await findManifest(config.devManifest);
    const { record } = await callTool(
      "get_manifest",
      { manifestId: id },
      { quiet: true },
    );
    console.log(`\nManifest "${config.devManifest}" (${id}):`);
    for (const { langCode } of releaseLangFiles()) {
      const entry = record.entries.find((e) => isOurEntry(e, langCode));
      console.log(
        entry
          ? `  [in]      ${config.engineSlug}/${langCode} (channel: ${entry.channel}, pinned: ${entry.pinnedVersion ?? "latest"})`
          : `  [missing] ${config.engineSlug}/${langCode} is not in this manifest`,
      );
    }
    break;
  }

  case "assign": {
    const manifest = await findManifest(config.devManifest);
    if (!manifest.devOnly)
      fail(
        `"${config.devManifest}" is not a dev-only manifest; refusing to edit it.`,
      );
    const { record } = await callTool(
      "get_manifest",
      { manifestId: manifest.id },
      { quiet: true },
    );
    const missing = releaseLangFiles()
      .map(({ langCode }) => langCode)
      .filter(
        (langCode) => !record.entries.some((e) => isOurEntry(e, langCode)),
      );
    if (missing.length === 0) {
      console.log(
        `cms: "${config.devManifest}" already contains all ${config.engineSlug} tiles.`,
      );
      break;
    }
    // update_manifest replaces the entry list, so keep every existing entry.
    await callTool("update_manifest", {
      manifestId: manifest.id,
      entries: [
        ...record.entries,
        ...missing.map((langCode) => ({
          engineSlug: config.engineSlug,
          bookSlug: "",
          langCode,
          channel: "development",
          pinnedVersion: null,
          title: null,
          userType: null,
          cacheable: true,
        })),
      ],
    });
    break;
  }

  default:
    fail(
      'usage: npm run cms -- <list|manifests|manifest [name]|reserve|upload|status|assign|tools> [--init] [--notes "…"] [--confirm-permanent]',
    );
}
