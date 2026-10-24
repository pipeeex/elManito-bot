import { ActivityType, Events } from "discord.js";
import { defineEvent } from "../types.js";

var status = [
  "vendiendo pegaditos a 2k",
  "corriendo de los tombos",
  "pegandolo en el mirador",
  "En clase 🤡",
  "gay",
];

export default defineEvent({
  name: Events.ClientReady,
  once: true,
  execute(client) {
    setInterval(function () {
      let rand = status[Math.floor(Math.random() * status.length)];
      client.user.setActivity(rand!, { type: ActivityType.Playing });
    }, 20000); //tiempo en milisegundos

    console.log(`Metiendo baretica a nombre de ${client.user.tag}`);
  },
});
