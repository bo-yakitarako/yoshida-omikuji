import type { Client } from 'discord.js';

export default async function (client: Client<true>) {
  console.log(`${client.user.tag} が起動しました`);
}
