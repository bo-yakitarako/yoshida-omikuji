import { ButtonInteraction, MessageFlags, RepliableInteraction, TextChannel } from 'discord.js';
import { omikuji, User } from '../db/User';
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

export const sendTotalResult = async (interaction: RepliableInteraction) => {
  if ((await checkTargetChannel(interaction)) === null) {
    return;
  }
  const allUsers = await User.findMany();
  type Count = { [key in keyof typeof omikuji]: number };
  const counts = Object.fromEntries(Object.keys(omikuji).map((l) => [l, 0])) as Count;
  allUsers.forEach(({ result }) => Object.values(result).forEach((luck) => counts[luck]++));
  const total = Object.values(counts).reduce((pre, cur) => pre + cur, 0);
  const title = `今までの全${total}回のおみくじは何が出たかなー？`;
  type CountEntry = [keyof typeof omikuji, number];
  const description = (Object.entries(counts) as CountEntry[])
    .filter(([, count]) => count > 0)
    .map(([luck, count]) => `${omikuji[luck]}: ${count}回`)
    .join('\n');
  const embeds = [buildEmbed(title, description, 'info')];
  await interaction.reply({ embeds });
};
