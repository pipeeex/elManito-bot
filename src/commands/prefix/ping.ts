import type { PrefixCommand } from "../../types.js";

const command: PrefixCommand = {
  name: "ping",
  aliases: ["p", "latencia"],
  description: "Responde con la latencia del bot",

  async execute(message) {
    const sent = await message.reply("Midiendo...");
    const roundtrip = sent.createdTimestamp - message.createdTimestamp;

    await sent.edit(
      `Ping suyo: ${roundtrip}ms · Mio:  ${message.client.ws.ping}ms`,
    );
  },
};

export default command;