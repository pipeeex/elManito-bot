
import {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder
} from "discord.js";

import type { SlashCommandFile } from "../../../types.js";

const command: SlashCommandFile = {
    data: new SlashCommandBuilder()
        .setName("conectar")
        .setDescription("Conecta tu cuenta de Canvas UMB"),

    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId("canvas:connect")
            .setTitle("Conectar Canvas UMB");

        const tokenInput = new TextInputBuilder()
            .setCustomId("canvas:token")
            .setLabel("Token de acceso de Canvas")
            .setPlaceholder("Pega tu token aquí")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMinLength(20)
            .setMaxLength(500);

        const row = new ActionRowBuilder<TextInputBuilder>()
            .addComponents(tokenInput);

        modal.addComponents(row);

        await interaction.showModal(modal);
    }
};

export default command;
