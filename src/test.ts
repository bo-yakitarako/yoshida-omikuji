import dayjs from 'dayjs';
import { Client, Events, GatewayIntentBits, TextChannel } from 'discord.js';
import { config } from 'dotenv';

config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.on(Events.ClientReady, async (client) => {
  const guildId = process.env.TEST_GUILD_ID ?? '';
  const channelId = process.env.TEST_CHANNEL_ID ?? '';
  const guild = await client.guilds.fetch(guildId);
  const channel = await guild?.channels.fetch(channelId);
  if (channel instanceof TextChannel) {
    await channel.send(dayjs().format());
  }
  await client.destroy();
});

client.login(process.env.TOKEN as string);
