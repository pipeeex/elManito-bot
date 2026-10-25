
import {
    SlashCommandBuilder,
    GuildMember,
    EmbedBuilder,
    type AutocompleteInteraction,
    MessageFlags
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
import type { SlashCommandFile, Choice } from "../../../types.js";


const MAX_CHOICES = 8;
const MAX_NAME = 100;
const MAX_VALUE = 100;
const MIN_QUERY = 3;
const CACHE_TTL = 60_000;
const CACHE_MAX = 100;

const players = new Map<string, ReturnType<typeof createAudioPlayer>>();

const rs = ["Reproduciendo: ", "Soyese este: ","Dejeme sonar este: ", "Sonando: "]


interface CacheEntry {
  expiresAt: number;
  choices: Choice[];
}


const searchCache = new Map<string, CacheEntry>();


const lastRequest = new Map<string, number>();

function readCache(key: string): Choice[] | undefined {
  const entry = searchCache.get(key);
  if (!entry) return undefined;

  if (entry.expiresAt < Date.now()) {
    searchCache.delete(key);
    return undefined;
  }

  return entry.choices;
}

function writeCache(key: string, choices: Choice[]): void {

  if (searchCache.size >= CACHE_MAX) {
    const oldest = searchCache.keys().next();
    if (!oldest.done) searchCache.delete(oldest.value);
  }

  searchCache.set(key, { expiresAt: Date.now() + CACHE_TTL, choices });
}


function normalize(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function truncate(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}

/** "Titulo · Autor (3:42)" recortado a 100 caracteres. */
function buildChoiceName(title: string, author: string, duration: string): string {
  const suffix = ` · ${author} (${duration})`;

  const room = MAX_NAME - suffix.length;

  if (room < 20) return truncate(`${title}${suffix}`, MAX_NAME);
  return `${truncate(title, room)}${suffix}`;
}

/** Siempre por aqui: si la interaccion caduco, respond() tira 10062. */
async function safeRespond(interaction: AutocompleteInteraction, choices: Choice[]): Promise<void> {
  await interaction.respond(choices.slice(0, 25)).catch(() => {});
}

// ---------------------------------------------------------------- resolver

interface ResolvedTrack {
  title: string;
  author: string;
  url: string;
  duration: string;
  thumbnail: string | null;
}

/**
 * Convierte lo que llego en la opcion a una pista concreta.
 *
 * Puede llegar de dos formas y las DOS tienen que funcionar:
 *  - una URL, porque el usuario eligio una sugerencia (el value es la url)
 *  - texto crudo, porque escribio y le dio Enter sin elegir nada
 */
async function resolveTrack(query: string): Promise<ResolvedTrack | null> {
  const kind = play.yt_validate(query);

  if (kind === "playlist") return null;

  // "video" cubre tanto una url de YouTube como un id pelado.
  if (kind === "video") {
    const info = await play.video_basic_info(query);
    const details = info.video_details;

    return {
      title: details.title ?? "Sin titulo",
      author: details.channel?.name ?? "Desconocido",
      url: details.url,
      duration: details.live ? "EN VIVO" : details.durationRaw,
      thumbnail: details.thumbnails.at(-1)?.url ?? null,
    };
  }

  const results = await play.search(query, {
    limit: 1,
    source: { youtube: "video" },
  });

  const first = results[0];
  if (!first) return null;

  return {
    title: first.title ?? "Sin titulo",
    author: first.channel?.name ?? "Desconocido",
    url: first.url,
    duration: first.live ? "EN VIVO" : first.durationRaw,
    thumbnail: first.thumbnails.at(-1)?.url ?? null,
  };
}

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

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused(true);

    // Si algun dia play tiene mas opciones, solo respondemos a esta.
    if (focused.name !== "cancion") {
      await safeRespond(interaction, []);
      return;
    }

    const raw = focused.value;
    const key = normalize(raw);

    if (key.length < MIN_QUERY) {
      await safeRespond(interaction, []);
      return;
    }

    if (play.yt_validate(raw.trim()) !== "search") {
      const url = raw.trim();
      await safeRespond(
        interaction,
        url.length <= MAX_VALUE ? [{ name: "Usar este enlace", value: url }] : [],
      );
      return;
    }

    const cached = readCache(key);
    if (cached) {
      await safeRespond(interaction, cached);
      return;
    }

    const stamp = Date.now();
    lastRequest.set(interaction.user.id, stamp);

    const results = await play.search(raw.trim(), {
      limit: MAX_CHOICES,
      source: { youtube: "video" },
    });

    const choices: Choice[] = [];
    const seen = new Set<string>();

    for (const video of results) {
      if (video.upcoming) continue;
      if (video.url.length > MAX_VALUE) continue;
      if (seen.has(video.url)) continue;

      seen.add(video.url);

      choices.push({
        name: buildChoiceName(
          video.title ?? "Sin titulo",
          video.channel?.name ?? "Desconocido",
          video.live ? "EN VIVO" : video.durationRaw,
        ),
        value: video.url,
      });
    }

    writeCache(key, choices);

    // Mientras buscabamos el usuario siguio tecleando: esta respuesta ya es
    // vieja y pintaria resultados que no corresponden a lo que tiene escrito.
    if (lastRequest.get(interaction.user.id) !== stamp) return;

    await safeRespond(interaction, choices);
  },

  async execute(interaction) {
    // inCachedGuild() estrecha los tipos de verdad: despues de esto
    // interaction.member es un GuildMember, sin castear nada a mano.
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: "Este comando solo sirve en un servidor.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const channel = interaction.member.voice.channel;

    if (!channel) {
      await interaction.reply({
        content: "Metase a un canal de voz primero, atembado",
      });
      return;
    }

    const query = interaction.options.getString("cancion", true);
    await interaction.deferReply();

    try {
      const track = await resolveTrack(query);

      if (!track) {
        await interaction.editReply(`No encontre nada con \`${truncate(query, 80)}\`.`);
        return;
      }

      const frase = rs[Math.floor(Math.random() * rs.length)];

      const embed = new EmbedBuilder()
        .setColor("Random")
        .setTitle(track.title)
        .setURL(track.url)
        .setDescription(frase!)
        .setThumbnail(track.thumbnail)
        .addFields(
          { name: "Autor", value: track.author, inline: true },
          { name: "Duracion", value: track.duration, inline: true },
          { name: "Canal", value: channel.name, inline: true },
        );
        
        const audio = await play.stream(track.url);

        // Crear o reutilizar el reproductor del servidor
        let player = players.get(interaction.guildId);

        if (!player) {
            player = createAudioPlayer();

            player.on("error", error => {
                console.error("Error de reproducción:", error.message);
            });

            players.set(interaction.guildId, player);
        }

        // Conectarse al canal de voz
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            selfDeaf: true
        });

        await entersState(
            connection,
            VoiceConnectionStatus.Ready,
            20_000
        );

        connection.subscribe(player);

        // Reproducir el audio obtenido de YouTube
        const resource = createAudioResource(audio.stream, {
            inputType: audio.type
        });

        player.play(resource);

        await entersState(
            player,
            AudioPlayerStatus.Playing,
            15_000
        );


      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error("[play] fallo resolviendo la cancion:", error);
      await interaction.editReply("Se me cayo buscando esa cancion.").catch(() => {});
    }
  },
};

export default command;
