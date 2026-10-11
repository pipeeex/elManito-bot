import { SlashCommandBuilder } from "discord.js";
import type { SlashCommand } from "../../types.js";

const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Responde con la latencia del bot"),

  async execute(interaction) {
    const sent = await interaction.reply({ content: "Midiendo...", withResponse: true });
    const roundtrip = (sent.resource?.message?.createdTimestamp ?? Date.now()) - interaction.createdTimestamp;

    await interaction.editReply(
      `Ping suyo: ${roundtrip}ms · Mio:  ${interaction.client.ws.ping}ms`,
    );
  },
};

export default command;