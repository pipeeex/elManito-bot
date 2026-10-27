
import {
  SlashCommandBuilder,
  GuildMember,
  EmbedBuilder,
  type AutocompleteInteraction,
  MessageFlags,
  ActionRowBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
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
import "../../../utils/musicManager.js"
import {
  musicManager,
  type Track,
} from "../../../utils/musicManager.js";
import { log } from "node:console";



const players = new Map<string, ReturnType<typeof createAudioPlayer>>();

const rs = ["Reproduciendo: ", "Soyese este: ", "Dejeme sonar este: ", "Sonando: ", "Silencio q puserion: "]

const command: SlashCommandFile = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Reproduce una cancion de YouTube")
    .addStringOption((option) =>
      option
        .setName("cancion")
        .setDescription("Nombre o URL de la cancion")
        .setRequired(true)
        .setAutocomplete(true),
    ),

  async execute(interaction) {

    const member = interaction.member as GuildMember;
    const channel = member.voice.channel;
    const guild = interaction.guild!;


    if (!guild) {
      await interaction.editReply(
        "Este comando solo funciona en un servidor."
      );
      return;
    }

    if (!channel) {
      await interaction.reply({
        content: "Primero entra a un canal de voz.",
        ephemeral: true,
      });
      return;
    }

    const query = interaction.options.getString("cancion", true);

    await interaction.deferReply();

    try {
      const results = await play.search(query, {
        limit: 1,
        source: { youtube: "video" },
      });

      const first = results[0];

      if (!first) {
        await interaction.editReply("No encontré esa canción.");
        return;
      }

      const currentTrack: Track = {
        title: first.title!,
        url: first.url,
        duration: first.durationRaw,
        thumbnail: first.thumbnails[0]?.url!,
      };

      console.log(first);


      let recommendations: Track[] = [];

      try {
        const related = await play.search(
          `${first.title} ${first.channel?.name} canciones similares `,
          {
            limit: 10,
            source: { youtube: "video" },
          }
        );

        const seen = new Set<string>([currentTrack.url]);

        recommendations = related
          .filter(song => {
            if (!song.title || !song.url || seen.has(song.url)) {
              return false;
            }

            seen.add(song.url);
            return true;
          })
          .slice(0, 5)
          .map(song => ({
            title: song.title!,
            url: song.url,
            duration: song.durationRaw,
            thumbnail: song.thumbnails[0]?.url!,
          }));
      } catch (error) {
        console.error("[music] Error buscando recomendaciones:", error);
      }

      // La canción elegida va primero; las recomendaciones quedan
      // en la cola para reproducirse automáticamente después.
      await musicManager.enqueue(
        interaction.guild,
        channel,
        [currentTrack, ...recommendations]
      );

      musicManager.setRecommendations(
        interaction.guild.id,
        recommendations
      );


      const frase = rs[Math.floor(Math.random() * rs.length)];

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`🎵 ${frase}`)
        .setDescription(
          `**[${currentTrack.title}](${currentTrack.url})**`
        )
        .addFields(
          {
            name: "Duración",
            value: currentTrack.duration ?? "Desconocida",
            inline: true,
          },
          {
            name: "Canciones en cola",
            value: String(recommendations.length),
            inline: true,
          },
          {
            name: "Recomendaciones",
            value: recommendations.length
              ? recommendations
                .map(
                  (song, index) =>
                    `**${index + 1}.** [${song.title}](${song.url})  (${song.duration ?? "?"})`
                )
                .join("\n")
              : "No encontré recomendaciones para esta canción.",
          }
        )
        .setThumbnail(currentTrack.thumbnail)
        .setFooter({
          text: "Usa el menú para elegir la siguiente canción.",
        });

      const components = [];

      if (recommendations.length > 0) {
        const menu = new StringSelectMenuBuilder()
          .setCustomId("music:recommendations")
          .setPlaceholder("Elegir la siguiente canción")
          .addOptions(
            recommendations.map((song, index) =>
              new StringSelectMenuOptionBuilder()
                .setLabel(song.title.slice(0, 100))
                .setValue(String(index))
                .setDescription("Pasar al siguiente puesto")
            )
          );

        components.push(
          new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(menu)
        );
      }


      const skipButton = new ButtonBuilder()
        .setCustomId("music:skip")
        .setLabel("Skip")
        .setEmoji("⏭️")
        .setStyle(ButtonStyle.Primary);

      components.push(
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(skipButton)
      );

      await interaction.editReply({
        embeds: [embed],
        components,
      });

      const reply = await interaction.fetchReply();

      musicManager.setPanelMessage(guild.id!, reply);

    } catch (error) {
      console.error("[slash] Error en /play:", error);

      await interaction.editReply(
        "No pude buscar o reproducir esa canción. Revisa la consola."
      );
    }
  },
};

export default command;
