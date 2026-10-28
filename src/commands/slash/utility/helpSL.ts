import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { SlashCommand, SlashCommandFile } from "../../../types.js";

const command: SlashCommandFile = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Muestra todos los comandos, agrupados por categoria")
    .addStringOption((option) =>
      option
        .setName("cmd")
        .setDescription("explicacion individual")
        .setRequired(false)
    ),
  async execute(interaction) {

    const registry = interaction.client.slashCommands;
    const cmd = interaction.options.getString("cmd", false);

    if (cmd) {
      const found = registry.lookup.get(cmd);
      
      if (!found) {
        await interaction.reply(`No existe el comando \`${cmd}\`.`);
        return;
      }
      const detail = new EmbedBuilder()
        .setTitle(`/${found.data.name}`)
        .setColor("Random")
        .addFields(
          {
            name: "Categoria",
            value: `${found.category}`,
            inline: true,
          },
          { name: "Uso", value: `\`/${found.data.name}\`` },
        );

      if (found.data.description) detail.setDescription(found.data.description);

      await interaction.reply({ embeds: [detail] });
      return;

    }


    const generalCommands = registry.byCategory.get("general") ?? [];
    const funCommands = registry.byCategory.get("fun") ?? [];
    const moderationCommands = registry.byCategory.get("moderation") ?? [];
    const utilityCommands = registry.byCategory.get("utility") ?? [];
    const musicCommands = registry.byCategory.get("music") ?? [];
    const canvasCommands = registry.byCategory.get("canvas") ?? [];

    const embed = new EmbedBuilder()
      .setTitle(`Comandos — ${registry.all.length} en total`)
      .setColor("Random")
      .setTimestamp()
      .addFields(
        { name: `GENERAL [${generalCommands.length}]:`, value: list(generalCommands) },
        { name: `FUN [${funCommands.length}]:`, value: list(funCommands) },
        { name: `MODERATION [${moderationCommands.length}]:`, value: list(moderationCommands) },
        { name: `UTILITY [${utilityCommands.length}]:`, value: list(utilityCommands) },
        { name: `MUSIC [${musicCommands.length}]:`, value: list(musicCommands) },
        { name: `CANVAS_UMB [${canvasCommands.length}]:`, value: list(canvasCommands) },
        
      );

    await interaction.reply({ embeds: [embed] });
  },
};

function list(commands: SlashCommand[]): string {
  if (commands.length === 0) return "—";

  const value = commands.map((cmd) => `\`${cmd.data.name}\``).join(" | ");
  return value.length > 1024 ? `${value.slice(0, 1021)}...` : value;
}

export default command;