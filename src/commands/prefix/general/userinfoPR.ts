import { EmbedBuilder } from "discord.js";
import type { PrefixCommandFile } from "../../../types.js";

const command: PrefixCommandFile = {
    name: "UserInformation",
    aliases: ["ui", "userinfo"],
    description: "Obten informacion sobre un usuario",

    async execute(message, args) {
        let badges = {
            "HypeSquadOnlineHouse3": "<:HouseBalance:815667560158199879>",
            "HypeSquadOnlineHouse1": "<:HouseBravery:815665320315715585>",
            "HypeSquadOnlineHouse2": "<:HouseBrilliance:815668365603110922>"
        }

        let usuario = message.mentions.users.first() ??
            message.client.users.cache.get(args[0]!) ??
            message.author;

        let iu = await usuario.fetch()
        console.log(iu.flags?.toArray(

        ));

        let flagtext = "Sin badges";
        const house = args[0];

        if (iu.flags) {
            if (iu.flags.toArray()) {
                if (iu.flags.toArray().join("\n")) {
                    flagtext =  house && Object.hasOwn(badges, house)
        ? badges[house as keyof typeof badges]
        : "Sin badges";
                }
            }
        }

        let embed = new EmbedBuilder()
            .setDescription(`Descripcion del usuario **${usuario.displayName}**`)
            .setThumbnail(usuario.displayAvatarURL())
            .setColor("Random")
            .addFields(
                { name: `ID:`, value: iu.id },
                { name: `ROLES`, value: `${flagtext}` },
                // { name: `MODERATION [${moderationCommands.length}]:`, value: list(moderationCommands) },
                // { name: `UTILITY [${utilityCommands.length}]:`, value: list(utilityCommands) },
                // { name: `MUSIC [${musicCommands.length}]:`, value: list(musicCommands) },
            )
        //  .addField(`ID`, `${usuario.avatarURL()}`)
        //  .addField(`Estado`, `${estados[usuario.presence.status]} ${connectedIn}`)
        //  .addField('Insigneas',`${flagtext}` )
        //  .addField('Creó su cuenta el: ', `${usuario.createdAt.toLocaleString()}`)
        // .addField('¿Es un bot?', `${iu.flags ? "Si":"No"}`)
        //.addField("Roles: ", `${usuario.roles.cache.map(m => m).join("**|**").toString()}` )
        return message.reply({ embeds: [embed] });

    },
};

export default command;