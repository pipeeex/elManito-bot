import { Collection } from "discord.js";
import type { SlashCommand } from "../types.js";
import { importFile, resolveFrom, walk } from "./walk.js";


function isSlashCommand(value: unknown): value is SlashCommand {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<SlashCommand>;
  return (
    typeof candidate.execute === "function" &&
    typeof candidate.data === "object" &&
    candidate.data !== null &&
    "name" in candidate.data
  );
}

export async function loadSlashCommands(): Promise<Collection<string, SlashCommand>> {
  const commands = new Collection<string, SlashCommand>();
  const dir = resolveFrom(import.meta.url, "..", "commands", "slash");

  for (const file of await walk(dir)) {
    const loaded = await importFile(file);

    if (!isSlashCommand(loaded)) {
      console.warn(`[slash] ${file} no exporta por default un SlashCommand valido, lo salto`);
      continue;
    }

    const name = loaded.data.name;

    if (commands.has(name)) {
      console.warn(`[slash] comando duplicado "${name}" en ${file}, lo salto`);
      continue;
    }

    commands.set(name, loaded);
  }

  console.log(`[slash] ${commands.size} comando(s) cargado(s)`);
  return commands;
}