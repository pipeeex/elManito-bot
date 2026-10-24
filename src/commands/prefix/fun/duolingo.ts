import type { promises } from "dns";
import type { PrefixCommandFile } from "../../../types.js";
import { URL } from "url";
import { EmbedBuilder } from "discord.js"



async function getUser(user: string) {
    const url = new URL("https://www.duolingo.com/2017-06-30/users");
    url.searchParams.set('username', user);

    const response = await fetch(url)

    if (!response.ok) throw new Error('respuestas ' + response.status)

    const data = await response.json()
    return data.users?.[0] ?? null



}

const command: PrefixCommandFile = {
    name: "duolingo",
    aliases: ["duo"],
    description: "Obten informacion de tu cuenta de Duolingo",

    async execute(message, args) {

        if (message.author.bot) return;
        if (!message.channel.isSendable()) return;


        if (!args) return message.reply("De quien quiere obtener informacion");


        const user = await getUser(args.toString())

        if (!user) return message.reply("No se encontro el usuario " + args)
        console.log(user);


        const detail = new EmbedBuilder()
            .setTitle(` Perfil de: **${user.username}**`)
            .setColor("Random")
            .addFields(
                { name: 'ID', value: user.id.toString() },
                { name: 'Super', value: user.hasPlus ? ":white_check_mark:" : ":x:" },
                { name: 'Cursos', value: user.courses[0].title.toString() },
                { name: "Racha",
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

        await message.reply({ embeds: [detail] })



    },
};

export default command;