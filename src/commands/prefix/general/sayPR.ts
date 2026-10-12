import type { PrefixCommandFile } from "../../../types.js";

const command: PrefixCommandFile = {
  name: "say",
  aliases: ["s", "decir"],
  description: "Repite lo q tu digas",

  async execute(message, args) {
    if (message.author.bot) return;
    if (!message.channel.isSendable()) return;
    
    await message.delete().catch(() => {});
    
    const text = args.join(" ");
    if(!text) return message.reply("Ponga el msg");
    await message.channel.send(text);
  
  },
};

export default command;