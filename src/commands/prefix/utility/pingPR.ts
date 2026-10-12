import type { PrefixCommandFile } from "../../../types.js";

const command: PrefixCommandFile  = {
  name: "ping",
  aliases: ["p", "latencia"],
  description: "Responde con la latencia del bot",
  usage: "ping",

  async execute(message) {
    const sent = await message.reply("Midiendo...");
    const roundtrip = sent.createdTimestamp - message.createdTimestamp;

    await sent.edit(
      `Ping suyo: ${roundtrip}ms · Mio:  ${message.client.ws.ping}ms`,
    );
  },
};

export default command;