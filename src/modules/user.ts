import {
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  MessageFlags,
  RepliableInteraction,
  TextChannel,
} from 'discord.js';
import { omikuji, User } from '../db/User';
import { buildEmbed, makeButtonRow, memberInfo } from '../utils';
import { checkTargetChannel } from './guild';
import dayjs from 'dayjs';

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
  const author = memberInfo(interaction, (name) => `${name}くんの今日の運勢`);
  const embeds = [buildEmbed(author, omikuji)];
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
  const embeds = [user.buildCountEnbed(interaction)];
  await interaction.reply({ content, embeds, components: [makeButtonRow('noticeCounts')], flags });
};

export const checkMonthCounts = async (interaction: ChatInputCommandInteraction) => {
  if ((await checkTargetChannel(interaction)) === null) {
    return;
  }
  const discordId = interaction.user.id;
  const user = await User.find({ discordId });
  if (user === null) {
    await interaction.reply({ content: '1回占ってこようねー', flags });
    return;
  }
  const today = dayjs();
  const year = interaction.options.getNumber('year') ?? today.year();
  const month = interaction.options.getNumber('month') ?? today.month() + 1;
  const embed = user.buildMonthCountEmbed(interaction, year, month);
  if (embed === null) {
    await interaction.reply({ content: 'その月は占っていないよ', flags });
    return;
  }
  const shareButton = new ButtonBuilder()
    .setCustomId(`shareMonthCounts-${year}-${month}`)
    .setLabel(`${year}年${month}月の軌跡をみんなに共有する`)
    .setStyle(ButtonStyle.Secondary);
  const content = `${year}年${month}月のやつだよ\nみんなに共有する場合はボタンを押してね`;
  const components = [makeButtonRow(shareButton)];
  await interaction.reply({ content, embeds: [embed], components, flags });
};

export const shareMonthCounts = async (interaction: ButtonInteraction) => {
  const [year, month] = interaction.customId.split('-').slice(1).map(Number);
  const user = (await User.find({ discordId: interaction.user.id }))!;
  const embed = user.buildMonthCountEmbed(interaction, year, month);
  await interaction.deferUpdate();
  await interaction.deleteReply();
  await (interaction.channel as TextChannel).send({ embeds: [embed] });
};

export const displayTodayResult = async (interaction: ButtonInteraction) => {
  await interaction.deferUpdate();
  await interaction.deleteReply();
  const discordId = interaction.user.id;
  const user = (await User.find({ discordId }))!;
  const author = memberInfo(interaction, (name) => `${name}くんの今日の運勢`);
  const embeds = [buildEmbed(author, user.todayOmikuji)];
  await (interaction.channel as TextChannel).send({ embeds });
};

export const noticeCounts = async (interaction: ButtonInteraction) => {
  await interaction.deferUpdate();
  await interaction.deleteReply();
  const discordId = interaction.user.id;
  const user = (await User.find({ discordId }))!;
  const embeds = [user.buildCountEnbed(interaction)];
  await (interaction.channel as TextChannel).send({ embeds });
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
