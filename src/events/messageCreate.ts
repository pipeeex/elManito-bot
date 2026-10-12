import { Events } from "discord.js";
import { defineEvent } from "../types.js";

const PREFIX = process.env.prefix ?? "!"

export default defineEvent({
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;


    const parts = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const name = parts.shift()?.toLowerCase();
    if (!name) return; // el mensaje era solo el prefijo

    const command = message.client.prefixCommands.lookup.get(name);
    if (!command) return; 

    try {
      await command.execute(message, parts);
    } catch (error) {
      console.error(`[prefix] error en "${name}":`, error);
      await message.reply("Algo se rompio ejecutando ese comando.").catch(() => {});
    }
  },
});