import { fileURLToPath } from "node:url";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const CODE_FILE = /\.(?:js|mjs|cjs|ts|mts|cts)$/;

export async function walk(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    // La carpeta no existe todavia: no es un error, simplemente no hay nada.
    return [];
  }

  const files: string[] = [];

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
      continue;
    }

    if (entry.name.endsWith(".d.ts")) continue;
    if (!CODE_FILE.test(entry.name)) continue;

    files.push(full);
  }

  return files;
}


export async function importFile(file: string): Promise<unknown> {
  const mod = (await import(pathToFileURL(file).href)) as { default?: unknown };
  return mod.default;
}

export function resolveFrom(importMetaUrl: string, ...segments: string[]): string {
  return path.join(path.dirname(fileURLToPath(importMetaUrl)), ...segments);
}
