import type { PrefixCommand, PrefixCommandFile } from "../../../types.js";
import { EmbedBuilder } from "discord.js";
import { categoryEmoji, categoryLabel } from "../../../categories.js";


const PREFIX = process.env.PREFIX ?? "!";

const command: PrefixCommandFile = {
    name: "help",
    aliases: ["h", "ayuda", "comandos"],
    description: "Obten las comandos disponibles",
    usage: "help [comando]",

    async execute(message, args) {
        const registry = message.client.prefixCommands;
        const query = args[0]?.toLowerCase();
        if (query) {
            const found = registry.lookup.get(query);

            if (!found) {
                await message.reply(`No existe el comando \`${query}\`.`);
                return;
            }

            const detail = new EmbedBuilder()
                .setTitle(`${PREFIX}${found.name}`)
                .setColor("Random")
                .addFields(
                    {
                        name: "Categoria",
                        value: `${categoryEmoji(found.category)}${categoryLabel(found.category)}`,
                        inline: true,
                    },
                    {
                        name: "Alias",
                        value: found.aliases?.length ? found.aliases.map((a) => `\`${a}\``).join(" | ") : "—",
                        inline: true,
                    },
                    { name: "Uso", value: `\`${PREFIX}${found.usage ?? found.name}\`` },
                );

            if (found.description) detail.setDescription(found.description);

            await message.reply({ embeds: [detail] });
            return;
        }

        //completo
        const generalCommands = registry.byCategory.get("general") ?? [];
        const funCommands = registry.byCategory.get("fun") ?? [];
        const moderationCommands = registry.byCategory.get("moderation") ?? [];
        const utilityCommands = registry.byCategory.get("utility") ?? [];
        const musicCommands = registry.byCategory.get("music") ?? [];
        const embed = new EmbedBuilder()
            .setTitle(`Comandos — ${registry.all.length} en total`)
            .setColor("Random")
            .setFooter({ text: `${PREFIX}help <comando> para ver el detalle de uno` })
            .setTimestamp()
            .addFields(
                { name: `GENERAL [${generalCommands.length}]:`, value: list(generalCommands) },
                { name: `FUN [${funCommands.length}]:`, value: list(funCommands) },
                { name: `MODERATION [${moderationCommands.length}]:`, value: list(moderationCommands) },
                { name: `UTILITY [${utilityCommands.length}]:`, value: list(utilityCommands) },
                { name: `MUSIC [${musicCommands.length}]:`, value: list(musicCommands) },
            );

        await message.reply({ embeds: [embed] });

    }

};
function list(commands: PrefixCommand[]): string {
    if (commands.length === 0) return "—";

    const value = commands.map((cmd) => `\`${cmd.name}\``).join(" | ");
    return value.length > 1024 ? `${value.slice(0, 1021)}...` : value;
}
export default command;