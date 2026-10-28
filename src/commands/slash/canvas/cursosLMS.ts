import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import type { SlashCommandFile } from "../../../types.js";
import { getCanvasCourses } from "../../../utils/canva.js";
import { log } from "node:console"
import { getCanvasToken } from "../../../db/canvasDatabase.js";

const command: SlashCommandFile = {
  data: new SlashCommandBuilder()
    .setName("cursos")
    .setDescription("Obtenga sus cursos de la U"),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const token = await getCanvasToken(interaction.user.id)
      if (!token) {
        interaction.editReply("No ha registrado su token, use /conectar")
        return;
      }
      const cursos = await getCanvasCourses(token);


      if (cursos.length === 0) {
        interaction.editReply("No hay cursos")
        return;
      }

      const mapi = cursos.slice(0, 20)

      const embed = new EmbedBuilder()
        .setTitle("Cursos de " + interaction.member?.user.username)
        .addFields(
          ...mapi.map(c => {
            const calificacion =
              c.current_grade ??
              (c.current_score != null
                ? `${c.current_score.toFixed(2)}%`
                : null);

            return {
              name: `${c.name}\nCódigo: ${c.course_code ?? "No disponible"}`,
              value:
                `**Calificación actual:** ${calificacion ?? "No disponible"}\n` +
                `[Abrir curso](https://umb.instructure.com/courses/${c.id})`,
              inline: true
            };
          })
        )
        .setFooter({ text: `Mostrando ${Math.min(cursos.length, 20)} de ${cursos.length} cursos` })
        .setColor("Random")

      await interaction.editReply({ embeds: [embed] })

    } catch (error) {
      console.error("[Canvas] Error consultando cursos:", error);

      await interaction.editReply(
        "No pude consultar Canvas. Revisa la configuración y los permisos de acceso."
      );
    }


  },
};

export default command;