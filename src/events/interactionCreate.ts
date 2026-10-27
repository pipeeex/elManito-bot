import { Events, MessageFlags } from "discord.js";
import { defineEvent } from "../types.js";
import { musicManager } from "../utils/musicManager.js";

export default defineEvent({
  name: Events.InteractionCreate,
  async execute(interaction) {

    if (
      interaction.isButton() &&
      interaction.customId === "music:skip"
    ) {
      if (!interaction.guildId) {
        await interaction.reply({
          content: "Este botón solo funciona en un servidor.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const skipped = musicManager.skip(interaction.guildId);

      if (!skipped) {
        await interaction.reply({
          content: "No hay ninguna canción reproduciéndose.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.reply({
        content: "⏭️ Canción saltada.",
          flags: MessageFlags.Ephemeral,
      });

      return;
    }
    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "music:recommendations"
    ) {
      if (!interaction.guildId) {
        await interaction.reply({
          content: "Este menú solo funciona en un servidor.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const index = Number(interaction.values[0]);

      if (!Number.isInteger(index)) {
        await interaction.reply({
          content: "La recomendación seleccionada no es válida.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const track = musicManager.prioritizeRecommendation(
        interaction.guildId,
        index
      );

      if (!track) {
        await interaction.reply({
          content: "No encontré esa recomendación.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.reply({
        content: `⏭️ **${track.title}** será la siguiente canción.`,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }


    if (interaction.isAutocomplete()) {
      const command = interaction.client.slashCommands.lookup.get(interaction.commandName);

      if (!command?.autocomplete) {
        await interaction.respond([]).catch(() => { });
        return;
      }
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error(`[autocomplete] error en "${interaction.commandName}":`, error);
        await interaction.respond([]).catch(() => { });
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;
    const command = interaction.client.slashCommands.lookup.get(interaction.commandName);


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
        await interaction.followUp(payload).catch(() => { });
      } else {
        await interaction.reply(payload).catch(() => { });
      }
    }
  },
});