import { Collection } from "discord.js";
import { sortCategories } from "../categories.js";
import type { CommandRegistry, PrefixCommand, PrefixCommandFile } from "../types.js";
import { categoryFromPath, importFile, resolveFrom, walk } from "./walk.js";

function isPrefixCommandFile(value: unknown): value is PrefixCommandFile {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<PrefixCommandFile>;
  return typeof candidate.name === "string" && typeof candidate.execute === "function";
}

export async function loadPrefixCommands(): Promise<CommandRegistry<PrefixCommand>> {
  const root = resolveFrom(import.meta.url, "..", "commands", "prefix");

  const lookup = new Collection<string, PrefixCommand>();
  const all: PrefixCommand[] = [];

  for (const file of await walk(root)) {
    const loaded = await importFile(file);

    if (!isPrefixCommandFile(loaded)) {
      console.warn(`[prefix] ${file} no exporta por default un comando valido, lo salto`);
      continue;
    }

    const command: PrefixCommand = { ...loaded, category: categoryFromPath(root, file) };
    const keys = [command.name, ...(command.aliases ?? [])].map((k) => k.toLowerCase());

    const conflict = keys.find((k) => lookup.has(k));
    if (conflict) {
      console.warn(`[prefix] "${conflict}" ya estaba registrado, salto ${file} completo`);
      continue;
    }

    // El nombre y cada alias apuntan al MISMO objeto: un solo get() resuelve ambos.
    for (const key of keys) lookup.set(key, command);

    // `all` tiene el comando UNA vez. Esta es la lista que se cuenta en el help,
    // no `lookup`, que trae los alias y te inflaria el numero.
    all.push(command);
  }

  const byCategory = groupByCategory(all);

  console.log(
    `[prefix] ${all.length} comando(s) en ${byCategory.size} categoria(s) ` +
      `(${lookup.size} claves contando alias)`,
  );

  return { lookup, all, byCategory };
}

function groupByCategory(commands: PrefixCommand[]): Collection<string, PrefixCommand[]> {
  const buckets = new Map<string, PrefixCommand[]>();

  for (const command of commands) {
    const bucket = buckets.get(command.category);
    if (bucket) bucket.push(command);
    else buckets.set(command.category, [command]);
  }

  const ordered = new Collection<string, PrefixCommand[]>();

  for (const key of sortCategories(buckets.keys())) {
    const bucket = buckets.get(key);
    if (bucket) ordered.set(key, [...bucket].sort((a, b) => a.name.localeCompare(b.name)));
  }

  return ordered;
}