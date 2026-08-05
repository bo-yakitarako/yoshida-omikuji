import type { Client } from 'discord.js';
import { sendNotices } from '@/modules/guild';

export default async function (client: Client<true>) {
  await sendNotices(client);
}
