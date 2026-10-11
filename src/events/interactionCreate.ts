import { Events, MessageFlags } from "discord.js";
import { defineEvent } from "../types.js";

export default defineEvent({
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.slashCommands.get(interaction.commandName);

    if (!command) {
      console.warn(`[slash] "${interaction.commandName}" no existe (quedo registrado en Discord?)`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[slash] error en "${interaction.commandName}":`, error);

      const payload = {
        content: "Algo se rompio ejecutando ese comando.",
        flags: MessageFlags.Ephemeral,
      } as const;

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
});