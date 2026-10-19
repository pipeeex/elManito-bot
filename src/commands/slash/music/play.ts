
import {
    SlashCommandBuilder,
    GuildMember,
    EmbedBuilder
} from "discord.js";

import {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    entersState,
    VoiceConnectionStatus,
    AudioPlayerStatus
} from "@discordjs/voice";

import play from "@iamtraction/play-dl";
import type { SlashCommandFile } from "../../../types.js";

const players = new Map<string, ReturnType<typeof createAudioPlayer>>();

const rs = ["Reproduciendo: ", "Soyese este: ","Dejeme sonar este: ", "Sonando: "]

const command: SlashCommandFile = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Reproduce una canción de YouTube")
        .addStringOption(option =>
            option
                .setName("cancion")
                .setDescription("Nombre o URL de la canción")
                .setRequired(true)
        ),

    async execute(interaction) {
        const member = interaction.member as GuildMember;
        const channel = member.voice.channel;

        if (!channel) {
            await interaction.reply({
                content: "Metase a un canal de voz primero, atembado",
                flags: "Ephemeral",
            })
            return;
        }

        const query = interaction.options.getString("cancion", true)
        await interaction.deferReply();


        try{

            const re = await play.search(query,{ 
                limit: 5, 
                source: {youtube: "video"}
            })

            let resu:String ='';
            for (let i = 0; i < re.length; i++) {
                resu += `${i+1}. **Titulo: ${re[i]?.title}**,\n\n __Autor__: ${re[i]?.channel}\n\n`
            }

                  const detail = new EmbedBuilder()
                    .setTitle(` Resultados para: ${query}`)
                    .setColor("Random")
                    .addFields(
                      {
                        name: "Se encontró **" +re.length + "** resultados",
                        value: `${resu}`,
                        inline: true,
                      }
                    );

                (await interaction.editReply({embeds: [detail]})).react(":one:")

                // const collector = interaction.channel?.createReactionCollector()
    






            
            
            // const song = re[0];
            // const audio = await play.stream(song!)
            

        }catch{

        }





    }
};

export default command;