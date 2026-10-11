import "dotenv/config";
import { Client, Collection } from "discord.js";
import { loadEvents } from "./src/loaders/loadEvents.js";
import { loadPrefixCommands } from "./src/loaders/loadPrefixCommands.js";
import { loadSlashCommands } from "./src/loaders/loadSlashCommands.js";

const client : Client = new Client({intents: 53608447});


client.slashCommands = new Collection();
client.prefixCommands = new Collection();

client.slashCommands = await loadSlashCommands();
client.prefixCommands = await loadPrefixCommands();
await loadEvents(client);


await client.login(process.env.TOKEN);