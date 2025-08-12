import { Client, Events, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
import { sendNotices } from './modules/guild';

config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.on(Events.ClientReady, async (client) => {
  await sendNotices(client);
  await client.destroy();
});

client.login(process.env.TOKEN as string);
