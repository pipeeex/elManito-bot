
import {
    EmbedBuilder,
    MessageFlags,
    SlashCommandBuilder
} from "discord.js";

import type { SlashCommandFile } from "../../../types.js";
import { getCanvasGrades } from "../../../utils/canva.js";
import { getCanvasToken } from "../../../db/canvasDatabase.js";


var res = [
  "pongase las pilas mi manito",
  "parece q va a la U a estudiar 🤡",
  "bajele al exceso de parche",
  "Espero q siga asi",
  "Mu bien mu bien",
  "Relajese q ya pasó"
];

const fr = Math.floor(Math.random()*res.length)

const command: SlashCommandFile = {
    data: new SlashCommandBuilder()
        .setName("notas")
        .setDescription("Consulta sus calificaciones de Canvas"),

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

            const notas = await getCanvasGrades(token);

            if (notas.length === 0) {
                await interaction.editReply(
                    "No encontré calificaciones publicadas para tus actividades."
                );
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`Notas de ${interaction.user.username}`)
                .setColor("Random")
                .setDescription(
                    `Encontré **${notas.length} actividades calificadas**.`
                )
                .addFields(
                    ...notas.slice(0, 20).map(nota => {
                        const fechaCalificacion = nota.graded_at
                            ? new Intl.DateTimeFormat("es-CO", {
                                dateStyle: "medium",
                                timeStyle: "short",
                                timeZone: "America/Bogota"
                            }).format(new Date(nota.graded_at))
                            : "Fecha no disponible";

                        const puntaje = nota.score !== null
                            ? `${nota.score}${nota.points_possible !== null
                                ? ` / ${nota.points_possible}`
                                : ""}`
                            : "No disponible";

                        const calificacion = nota.grade !== null
                            ? ` (${nota.grade})`
                            : "";

                        const enlace = nota.html_url
                            ?? `https://umb.instructure.com/courses/${nota.course_id}/assignments/${nota.assignment_id}`;

                        return {
                            name: nota.assignment_name.slice(0, 256),
                            value:
                                `**Curso:** ${nota.course_name}\n` +
                                `**Puntaje:** ${puntaje}${calificacion}\n` +
                                `**Calificada:** ${fechaCalificacion}\n` +
                                `[Ver actividad](${enlace})`,
                            inline: true
                        };
                    })
                )
                .setFooter({
                    text: `Mostrando ${Math.min(notas.length, 20)} de ${notas.length} actividades (${fr})`
                });

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {
            console.error("[Canvas] Error consultando calificaciones:", error);

            await interaction.editReply(
                "No pude consultar tus calificaciones. Verifica tu conexión con Canvas e inténtalo de nuevo."
            );
        }
    }
};

export default command;
