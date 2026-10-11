import { Collection } from "discord.js";
import type { PrefixCommand } from "../types.js";
import { importFile, resolveFrom, walk } from "./walk.js";

function isPrefixCommand(value: unknown): value is PrefixCommand {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<PrefixCommand>;
  return typeof candidate.name === "string" && typeof candidate.execute === "function";
}

export async function loadPrefixCommands(): Promise<Collection<string, PrefixCommand>> {
  const commands = new Collection<string, PrefixCommand>();
  const dir = resolveFrom(import.meta.url, "..", "commands", "prefix");
  let count = 0;

  for (const file of await walk(dir)) {
    const loaded = await importFile(file);

    if (!isPrefixCommand(loaded)) {
      console.warn(`[prefix] ${file} no exporta por default un PrefixCommand valido, lo salto`);
      continue;
    }

    // El nombre y cada alias apuntan al MISMO objeto: asi un solo get() resuelve ambos.
    for (const key of [loaded.name, ...(loaded.aliases ?? [])]) {
      const lower = key.toLowerCase();

      if (commands.has(lower)) {
        console.warn(`[prefix] "${lower}" ya estaba registrado (${file}), lo salto`);
        continue;
      }

      commands.set(lower, loaded);
    }

    count++;
  }

  console.log(`[prefix] ${count} comando(s) cargado(s) (${commands.size} claves con alias)`);
  return commands;
}