import { ButtonInteraction, MessageFlags, RepliableInteraction, TextChannel } from 'discord.js';
import { User } from '../db/User';
import { buildEmbed, makeButtonRow } from '../utils';

const flags = MessageFlags.Ephemeral;

export const draw = async (interaction: ButtonInteraction) => {
  const discordId = interaction.user.id;
  let user = (await User.find({ discordId }))!;
  if (user === null) {
    user = await User.create({ discordId, result: {} });
  }
  const { omikuji, success } = await user.draw();
  if (!success) {
    const content = `今日はもう占い済みで、**${omikuji}**だったよ。このチャンネルのみんなに知らせる場合はボタンを押してね`;
    const components = [makeButtonRow('todayResult')];
    await interaction.reply({ content, components, flags });
    return;
  }
  await interaction.deferUpdate();
  const embeds = [buildEmbed(`${name(interaction)}くんの今日の運勢`, omikuji)];
  await (interaction.channel as TextChannel).send({ embeds });
};

export const displayCounts = async (interaction: ButtonInteraction) => {
  const discordId = interaction.user.id;
  const user = await User.find({ discordId });
  if (user === null) {
    await interaction.reply({ content: '1回占ってこようねー', flags });
    return;
  }
  await interaction.deferUpdate();
  const embeds = [buildEmbed(`${name(interaction)}くんの軌跡`, user.buildCountDescription())];
  await (interaction.channel as TextChannel).send({ embeds });
};

export const displayTodayResult = async (interaction: ButtonInteraction) => {
  await interaction.deferUpdate();
  const discordId = interaction.user.id;
  const user = (await User.find({ discordId }))!;
  const embeds = [buildEmbed(`${name(interaction)}くんの今日の運勢`, user.todayOmikuji)];
  await (interaction.channel as TextChannel).send({ embeds });
};

const name = ({ guild, user }: RepliableInteraction) => {
  return guild?.members.cache.get(user.id)?.displayName ?? user.username;
};
