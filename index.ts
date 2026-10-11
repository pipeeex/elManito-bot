import  { Client, Message } from "discord.js";
const client : Client = new Client({intents: 53608447});
import "dotenv/config";

client.on("clientReady", () => {
    console.log("Im ready with username: " + client.user?.tag)
    
});




client.login(process.env.TOKEN);