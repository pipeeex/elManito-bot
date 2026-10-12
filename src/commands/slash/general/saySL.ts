import { SlashCommandBuilder } from "discord.js";
import type { SlashCommandFile } from "../../../types.js";

const command: SlashCommandFile = {
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