import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { brotliCompress, constants, gzip } from "node:zlib";

// Writes .br and .gz copies next to each compressible file in a build folder,
// so nginx can serve them with brotli_static/gzip_static instead of
// compressing on every request. Usage: node scripts/web-precompress.ts web/dist
const COMPRESSIBLE_EXTENSIONS = new Set([
  ".html",
  ".js",
  ".mjs",
  ".css",
  ".json",
  ".svg",
  ".wasm",
  ".txt",
]);
const MIN_SIZE_BYTES = 1024;

const brotliAsync = promisify(brotliCompress);
const gzipAsync = promisify(gzip);

async function main() {
  const root = process.argv[2];
  if (!root) {
    throw new Error("Usage: node scripts/web-precompress.ts <folder>");
  }

  const files = await listFiles(root);
  const targets = files.filter((file) =>
    COMPRESSIBLE_EXTENSIONS.has(path.extname(file)),
  );
  const results = await Promise.all(targets.map(compressFile));

  const written = results.filter(Boolean).length;
  process.stdout.write(`Precompressed ${written} of ${targets.length} files\n`);
}

async function listFiles(folder: string): Promise<string[]> {
  const entries = await readdir(folder, {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(entry.parentPath, entry.name));
}

// Returns false when the file is too small or doesn't shrink, since serving
// the original is just as fast then.
async function compressFile(file: string): Promise<boolean> {
  const original = await readFile(file);
  if (original.length < MIN_SIZE_BYTES) {
    return false;
  }

  const [brotli, gzipped] = await Promise.all([
    brotliAsync(original, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
        [constants.BROTLI_PARAM_SIZE_HINT]: original.length,
      },
    }),
    gzipAsync(original, { level: constants.Z_BEST_COMPRESSION }),
  ]);
  if (gzipped.length >= original.length) {
    return false;
  }

  await Promise.all([
    writeFile(`${file}.br`, brotli),
    writeFile(`${file}.gz`, gzipped),
  ]);
  return true;
}

main().catch((error: unknown) => {
  process.stderr.write(`Precompress failed: ${String(error)}\n`);
  process.exit(1);
});
