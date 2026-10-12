import { Collection } from "discord.js";
import { sortCategories } from "../categories.js";
import type { CommandRegistry, SlashCommand, SlashCommandFile } from "../types.js";
import { categoryFromPath, importFile, resolveFrom, walk } from "./walk.js";

function isSlashCommandFile(value: unknown): value is SlashCommandFile {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<SlashCommandFile>;
  return (
    typeof candidate.execute === "function" &&
    typeof candidate.data === "object" &&
    candidate.data !== null &&
    "name" in candidate.data
  );
}

export async function loadSlashCommands(): Promise<CommandRegistry<SlashCommand>> {
  const root = resolveFrom(import.meta.url, "..", "commands", "slash");

  const lookup = new Collection<string, SlashCommand>();
  const all: SlashCommand[] = [];

  for (const file of await walk(root)) {
    const loaded = await importFile(file);

    if (!isSlashCommandFile(loaded)) {
      console.warn(`[slash] ${file} no exporta por default un comando valido, lo salto`);
      continue;
    }

    const command: SlashCommand = { ...loaded, category: categoryFromPath(root, file) };
    const name = command.data.name;

    if (lookup.has(name)) {
      console.warn(`[slash] comando duplicado "${name}" en ${file}, lo salto`);
      continue;
    }

    lookup.set(name, command);
    all.push(command);
  }

  const byCategory = groupByCategory(all);
  console.log(`[slash] ${all.length} comando(s) en ${byCategory.size} categoria(s)`);

  return { lookup, all, byCategory };
}

function groupByCategory(commands: SlashCommand[]): Collection<string, SlashCommand[]> {
  const buckets = new Map<string, SlashCommand[]>();

  for (const command of commands) {
    const bucket = buckets.get(command.category);
    if (bucket) bucket.push(command);
    else buckets.set(command.category, [command]);
  }

  const ordered = new Collection<string, SlashCommand[]>();

  for (const key of sortCategories(buckets.keys())) {
    const bucket = buckets.get(key);
    if (bucket) {
      ordered.set(
        key,
        [...bucket].sort((a, b) => a.data.name.localeCompare(b.data.name)),
      );
    }
  }

  return ordered;
}