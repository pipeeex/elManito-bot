import { REST, Routes } from "discord.js";
import "dotenv/config";
import { loadSlashCommands } from "./loaders/loadSlashCommands.js";

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token) throw new Error("Falta");
if (!clientId) throw new Error("Falta");

const commands = await loadSlashCommands();
const body = commands.all.map((command) => command.data.toJSON());

const rest = new REST().setToken(token);

// Con GUILD_ID: registro instantaneo en ese servidor (para desarrollo).
// Sin GUILD_ID: registro global, Discord puede tardar hasta 1 hora en propagarlo.
const route = guildId
  ? Routes.applicationGuildCommands(clientId, guildId)
  : Routes.applicationCommands(clientId);

const result = (await rest.put(route, { body })) as unknown[];

console.log(
  `${result.length} comando(s) registrado(s) ${guildId ? `en el guild ${guildId}` : "globalmente"}`,
);