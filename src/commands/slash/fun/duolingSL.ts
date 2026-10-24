import { SlashCommandBuilder } from "discord.js";
import type { SlashCommandFile } from "../../../types.js";
import { EmbedBuilder } from "discord.js"



async function getUser(user: string) {
    const url = new URL("https://www.duolingo.com/2017-06-30/users");
    url.searchParams.set('username', user);

    const response = await fetch(url)

    if (!response.ok) throw new Error('respuestas ' + response.status)

    const data = await response.json()
    return data.users?.[0] ?? null



}

const command: SlashCommandFile = {
    data: new SlashCommandBuilder()
        .setName("duolingo")
        .setDescription("Obten informacion de tu cuenta de Duolingo")
        .addStringOption((option) =>
            option
                .setName("usuario")
                .setDescription("usuario para obtener informacion")
                .setRequired(true)
        ),
    async execute(interaction) {

        const args = interaction.options.getString("usuario", true);
        await interaction.reply({ content: "Buscando...", withResponse: true });

        const user = await getUser(args)
        const detail = new EmbedBuilder()
            .setTitle(` Perfil de: **${user.username}**`)
            .setColor("Random")
            .addFields(
                { name: 'ID', value: user.id.toString() },
                { name: 'Super', value: user.hasPlus ? ":white_check_mark:" : ":x:" },
                { name: 'Cursos', value: user.courses[0].title.toString() },
                {
                    name: "Racha",
                    value:
                        user.streak.toString() +
                        "\nIniciada el: " +
                        (user.streakData.currentStreak == null
                            ? "No hay registro"
                            : user.streakData.currentStreak.startDate)
                },
                { name: 'Total XP', value: user.totalXp.toString() },

            )
            .setThumbnail(`https:${user.picture}/xlarge`)

        await interaction.editReply({content: "", embeds: [detail] })



    },
};

export default command;