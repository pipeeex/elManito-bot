import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types.js";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("El bot repite lo q tu digas")
    .addStringOption((option) =>
      option
        .setName("texto")
        .setDescription("Texto que quieres enviar")
        .setRequired(true)
    ),
  async execute(interaction) {

    const text = interaction.options.getString("texto", true);

    interaction.reply(text);


  },
};

export default command;