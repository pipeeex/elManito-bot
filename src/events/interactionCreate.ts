import { Events, MessageFlags } from "discord.js";
import { defineEvent } from "../types.js";
import { validateCanvasToken } from "../utils/canva.js";
import { saveCanvasAccount } from "../db/canvasDatabase.js";

export default defineEvent({
  name: Events.InteractionCreate,
  async execute(interaction) {

    if (
      interaction.isModalSubmit() &&
      interaction.customId === "canvas:connect"
    ) {
      await interaction.deferReply({
        flags: MessageFlags.Ephemeral
      });

      const token = interaction.fields
        .getTextInputValue("canvas:token")
        .trim();

      try {
        const valid = await validateCanvasToken(token);

        if (!valid) {
          await interaction.editReply(
            "El token no es válido o Canvas no permite acceder con él. Revisa el token e inténtalo de nuevo."
          );
          return;
        }

        saveCanvasAccount(interaction.user.id, token);

        await interaction.editReply(
          "Tu cuenta de Canvas UMB se conectó correctamente. Ya puedes usar los comandos compatibles."
        );
      } catch(error) {

          console.error(`[slash] error:`,error);

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