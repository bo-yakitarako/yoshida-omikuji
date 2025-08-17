import { ButtonInteraction, MessageFlags, RepliableInteraction, TextChannel } from 'discord.js';
import { User } from '../db/User';
import { buildEmbed, makeButtonRow } from '../utils';
import { checkTargetChannel } from './guild';

const flags = MessageFlags.Ephemeral;

export const draw = async (interaction: RepliableInteraction) => {
  const target = await checkTargetChannel(interaction);
  if (target === null) {
    return;
  }
  const discordId = interaction.user.id;
  let user = (await User.find({ discordId }))!;
  if (user === null) {
    user = await User.create({ discordId, result: {} });
  }
  const { omikuji, success } = await user.draw();
  if (!success) {
    const content = `今日はもう占い済みで、**${omikuji}**だったよ\nこのチャンネルのみんなに知らせる場合はボタンを押してね`;
    const components = [makeButtonRow('todayResult')];
    await interaction.reply({ content, components, flags });
    return;
  }
  const embeds = [buildEmbed(`${name(interaction)}くんの今日の運勢`, omikuji)];
  if (interaction.isButton()) {
    await interaction.deferUpdate();
    await target.send({ embeds });
  } else {
    await interaction.reply({ embeds });
  }
};

export const checkCounts = async (interaction: RepliableInteraction) => {
  if ((await checkTargetChannel(interaction)) === null) {
    return;
  }
  const discordId = interaction.user.id;
  const user = await User.find({ discordId });
  if (user === null) {
    await interaction.reply({ content: '1回占ってこようねー', flags });
    return;
  }
  const content = '吉田は何回出たかなー？\nみんなに共有する場合はボタンを押してね';
  const embeds = [buildEmbed(`${name(interaction)}くんの軌跡`, user.buildCountDescription())];
  await interaction.reply({ content, embeds, components: [makeButtonRow('noticeCounts')], flags });
};

export const displayTodayResult = async (interaction: ButtonInteraction) => {
  await interaction.deferUpdate();
  const discordId = interaction.user.id;
  const user = (await User.find({ discordId }))!;
  const embeds = [buildEmbed(`${name(interaction)}くんの今日の運勢`, user.todayOmikuji)];
  await (interaction.channel as TextChannel).send({ embeds });
};

export const noticeCounts = async (interaction: ButtonInteraction) => {
  await interaction.deferUpdate();
  const discordId = interaction.user.id;
  const user = (await User.find({ discordId }))!;
  const embeds = [buildEmbed(`${name(interaction)}くんの軌跡`, user.buildCountDescription())];
  await (interaction.channel as TextChannel).send({ embeds });
};

const name = ({ guild, user }: RepliableInteraction) => {
  return guild?.members.cache.get(user.id)?.displayName ?? user.username;
};
