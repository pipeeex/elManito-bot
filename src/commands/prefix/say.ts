import type { PrefixCommand } from "../../types.js";

const command: PrefixCommand = {
  name: "say",
  aliases: ["s", "decir"],
  description: "Repite lo q tu digas",

  async execute(message, parts) {
    if (message.author.bot) return;
    if (!message.channel.isSendable()) return;
    
    await message.delete().catch(() => {});
    
    const text = parts.join(" ");
    if(!text) return message.reply("Ponga el msg");
    await message.channel.send(text);
  
  },
};

export default command;