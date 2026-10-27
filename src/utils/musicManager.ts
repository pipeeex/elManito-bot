import {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    entersState,
    joinVoiceChannel,
    VoiceConnectionStatus,
    type AudioPlayer,
    type VoiceConnection,
} from "@discordjs/voice";

import {
    EmbedBuilder,
    type Message,
} from "discord.js";

import play from "@iamtraction/play-dl";
import type { Guild, VoiceBasedChannel } from "discord.js";

const rs = ["Reproduciendo: ", "Soyese este: ", "Dejeme sonar este: ", "Sonando: ", "Silencio q puserion: "]



export type Track = {
    title: string;
    url: string;
    duration: string;
    thumbnail: string;
};

type GuildMusic = {
    player: AudioPlayer;
    connection: VoiceConnection;
    queue: Track[];
    recommendations: Track[];
    loading: boolean;
    currentTrack?: Track;
    panelMessage?: Message;
};

class MusicManager {
    private guilds = new Map<string, GuildMusic>();

    private async getOrCreate(
        guild: Guild,
        channel: VoiceBasedChannel
    ): Promise<GuildMusic> {
        let music = this.guilds.get(guild.id);

        if (!music) {
            const player = createAudioPlayer();

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: true,
            });

            music = {
                player,
                connection,
                queue: [],
                recommendations: [],
                loading: false,
                currentTrack: undefined!,
                panelMessage: undefined!,
            };

            this.guilds.set(guild.id, music);

            player.on("error", error => {
                console.error("[music] Error de audio:", error.message);

                if (player.state.status !== AudioPlayerStatus.Idle) {
                    player.stop();
                }
            });

            player.on("stateChange", (oldState, newState) => {
                if (
                    oldState.status !== AudioPlayerStatus.Idle &&
                    newState.status === AudioPlayerStatus.Idle
                ) {
                    void this.playNext(guild.id);
                }
            });
        } else if (music.connection.state.status === VoiceConnectionStatus.Destroyed) {


            music.connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: true,
            });

            music.connection.subscribe(music.player);
        }

        if (music.connection.joinConfig.channelId !== channel.id) {
            music.connection.destroy();

            music.connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: guild.id,
                adapterCreator: guild.voiceAdapterCreator,
                selfDeaf: true,
            });

            music.connection.subscribe(music.player);
        } else {
            music.connection.subscribe(music.player);
        }

        await entersState(
            music.connection,
            VoiceConnectionStatus.Ready,
            20_000
        );

        return music;
    }

    setPanelMessage(guildId: string, message: Message): void {
        const music = this.guilds.get(guildId);

        if (!music) return;

        music.panelMessage = message;

        void this.updatePanel(guildId);
    }
   private fraseRand() {
       return rs[Math.floor(Math.random() * rs.length)];
    }
    private async updatePanel(guildId: string): Promise<void> {
        const music = this.guilds.get(guildId);

        if (!music?.panelMessage || !music.currentTrack) return;

        const track = music.currentTrack;
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
        if(track){
            embed
            .setTitle("🎵 "+ this.fraseRand())
            .setDescription(`**[${track.title}](${track.url})**`)
            .addFields(
                {
                    name: "Duración",
                    value: track.duration ?? "Desconocida",
                    inline: true,
                },
                {
                    name: "Canciones en cola",
                    value: String(music.queue.length),
                    inline: true,
                },
                {
                    name: "En cola",
                    value: music.queue.length
                        ? music.queue
                            .map(
                                (song, index) =>
                                    `**${index + 1}.** [${song.title}](${song.url}) (${song.duration ?? "?"})`
                            )
                            .join("\n")
                        : "No canciones en cola, pongalo a sonar /play _cancion_",
                },
            )
            .setFooter({
                text: "Usa el menú para elegir una canción o pulsa Skip.",
            });

        if (track.thumbnail) {
            embed.setThumbnail(track.thumbnail);
        }
    
        await music.panelMessage.edit({
            embeds: [embed],
        }).catch(error => {
            console.error("[music] No se pudo actualizar el embed:", error);
        });
        }else {
                embed
        .setTitle("🔇 No hay canciones reproduciéndose")
        .setDescription(
            music.queue.length > 0
                ? "Preparando la siguiente canción..."
                : "La cola está vacía. Use `/play` para reproducir música."
        )
        .setThumbnail(null);
        }
    }

    async enqueue(
        guild: Guild,
        channel: VoiceBasedChannel,
        tracks: Track[]
    ): Promise<void> {
        const music = await this.getOrCreate(guild, channel);

        music.queue.push(...tracks);

        if (
            music.player.state.status === AudioPlayerStatus.Idle &&
            !music.loading
        ) {
            await this.playNext(guild.id);
        }
    }

    setRecommendations(guildId: string, tracks: Track[]): void {
        const music = this.guilds.get(guildId);

        if (music) {
            music.recommendations = tracks;
        }
    }

    prioritizeRecommendation(
        guildId: string,
        index: number
    ): Track | undefined {
        const music = this.guilds.get(guildId);
        if (!music) return undefined;

        const track = music.recommendations[index];
        if (!track) return undefined;

        const existingIndex = music.queue.findIndex(
            queued => queued.url === track.url
        );

        if (existingIndex >= 0) {
            music.queue.splice(existingIndex, 1);
        }

        music.queue.unshift(track);

        if (
            music.player.state.status === AudioPlayerStatus.Idle &&
            !music.loading
        ) {
            void this.playNext(guildId);
        }

        return track;
    }

    skip(guildId: string): boolean {
        const music = this.guilds.get(guildId);

        if (!music) return false;

        if (music.player.state.status === AudioPlayerStatus.Idle) {
            return false;
        }

        // Al pasar a Idle, el listener existente reproduce
        // automáticamente la siguiente canción de la cola.
        return music.player.stop(true);
    }

    private async playNext(guildId: string): Promise<void> {
        const music = this.guilds.get(guildId);
        

        if (!music || music.loading) return;

        const track = music.queue.shift();

        if (!track) return;

        music.currentTrack = track;
        
        music.loading = true;
        
        try {
            const audio = await play.stream(track.url);
            
            const resource = createAudioResource(audio.stream, {
                inputType: audio.type,
                metadata: track,
            });
            
            music.player.play(resource);
            await this.updatePanel(guildId);

            console.log(`[music] Reproduciendo: ${track.title}`);
        } catch (error) {
            console.error(
                `[music] No se pudo reproducir "${track.title}":`,
                error
            );
        } finally {
            music.loading = false;

            // Si el recurso falló y el reproductor quedó inactivo,
            // intenta continuar con la siguiente canción.
            if (
                music.player.state.status === AudioPlayerStatus.Idle &&
                music.queue.length > 0
            ) {
                void this.playNext(guildId);
            }
        }
    }
}

export const musicManager = new MusicManager();
