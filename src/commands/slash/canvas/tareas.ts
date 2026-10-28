
import {
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder
} from "discord.js";

import type { SlashCommandFile } from "../../../types.js";
import { getPendingAssignments } from "../../../utils/canva.js";
import { getCanvasToken } from "../../../db/canvasDatabase.js";




const command: SlashCommandFile = {
    data: new SlashCommandBuilder()
        .setName("tareas")
        .setDescription("vea sus tareas pendientes socio"),

    async execute(interaction) {
        await interaction.deferReply({
        });

        try {
            const token = getCanvasToken(interaction.user.id);

            if (!token) {
                await interaction.editReply(
                    "No tienes Canvas conectado. Ejecuta `/conectar` primero."
                );
                return;
            }

            const tareas = await getPendingAssignments(token);

            if (tareas.length === 0) {
                await interaction.editReply(
                    "¡No tienes tareas pendientes registradas en Canvas!"
                );
                return;
            }

            const ahora = Date.now();

            const embed = new EmbedBuilder()
                .setTitle("Sus trabajos pendientes")
                .setColor("Random")
                .setDescription(
                    `Encontré **${tareas.length} tareas pendientes** en tus cursos. Vaya hgalas prbo`
                )
                .addFields(
                    ...tareas.slice(0, 20).map(tarea => {
                        const vencida = tarea.due_at !== null
                            && new Date(tarea.due_at).getTime() < ahora;

                        const fecha = tarea.due_at
                            ? new Intl.DateTimeFormat("es-CO", {
                                dateStyle: "medium",
                                timeStyle: "short",
                                timeZone: "America/Bogota"
                            }).format(new Date(tarea.due_at))
                            : "Sin fecha límite";

                        const enlace = tarea.html_url
                            ?? `https://umb.instructure.com/courses/${tarea.course_id}/assignments/${tarea.id}`;

                        return {
                            name: `${vencida ? "🔴" : "📝"} ${tarea.name}`.slice(0, 256),
                            value:
                                `**Curso:** ${tarea.course_name}\n` +
                                `**Entrega:** ${fecha}` +
                                `${vencida ? " (Vencida)" : ""}\n` +
                                `[Abrir tarea](${enlace})`,
                            inline: true
                        };
                    })
                )
                .setFooter({
                    text: `Mostrando ${Math.min(tareas.length, 20)} de ${tareas.length} tareas`
                });

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("[Canvas] Error consultando tareas pendientes:", error);

            await interaction.editReply(
                "No pude consultar tus tareas. Revisa tu conexión de Canvas e inténtalo de nuevo."
            );
        }
    }
};

export default command;
