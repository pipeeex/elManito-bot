import { Activity, ActivityType, Events } from "discord.js";
import { defineEvent } from "../types.js";

export default defineEvent({
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Metiendo baretica a nombre de ${client.user.tag}`);
    client.user.setActivity("vendiendo pegaditos a 2k",{
        type: ActivityType.Playing
    })


  },
});