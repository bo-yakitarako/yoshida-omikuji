import dayjs from 'dayjs';
import type { ChatInputCommandInteraction, RepliableInteraction, ButtonInteraction } from 'disbord';
import { makeButtonRow } from 'disbord';
import { buildEmbed, getMemberInfo } from 'disbord/utils';
import { TextChannel } from 'discord.js';
import { Total } from '@/db/models/Total';
import { omikuji, User } from '@/db/models/User';
import { checkTargetChannel } from '@/modules/guild';

export const draw = async (interaction: RepliableInteraction) => {
  const target = await checkTargetChannel(interaction);
  if (target === null) {
    return;
  }
  const discordId = interaction.user.id;
  const user = await (async () => {
    const user = await User.find({ discordId });
    return user ?? (await User.create({ discordId }));
  })();
  const { omikuji, success } = await user.draw(discordId);
  if (!success) {
    const content = `今日はもう占い済みで、**${omikuji}**だったよ\nこのチャンネルのみんなに知らせる場合はボタンを押してね`;
    const components = [makeButtonRow('todayResult')];
    await interaction.ephemeral({ content, components });
    return;
  }
  const author = getMemberInfo(interaction, (name) => `${name}くんの今日の運勢`);
  const embeds = [buildEmbed(author, omikuji, 'success')];
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
    await interaction.ephemeral('1回占ってこようねー');
    return;
  }
  const content = '吉田は何回出たかなー？\nみんなに共有する場合はボタンを押してね';
  const embeds = [user.buildCountEmbed(interaction)];
  await interaction.ephemeral({ content, embeds, components: [makeButtonRow('noticeCounts')] });
};

export const checkMonthCounts = async (interaction: ChatInputCommandInteraction) => {
  if ((await checkTargetChannel(interaction)) === null) {
    return;
  }
  const discordId = interaction.user.id;
  const user = await User.find({ discordId });
  if (user === null) {
    await interaction.ephemeral('1回占ってこようねー');
    return;
  }
  const today = dayjs();
  const year = interaction.options.getInteger('year') ?? today.year();
  const month = interaction.options.getInteger('month') ?? today.month() + 1;
  const embed = await user.buildMonthCountEmbed(interaction, year, month);
  if (embed === null) {
    await interaction.ephemeral('その月は占っていないよ');
    return;
  }
  const content = `${year}年${month}月のやつだよ\nみんなに共有する場合はボタンを押してね`;
  const components = [makeButtonRow(['shareMonthCounts', year, month])];
  await interaction.ephemeral({ content, embeds: [embed], components });
};

export const shareEmbed = async (interaction: ButtonInteraction) => {
  await interaction.deferUpdate();
  await interaction.deleteReply();
  await (interaction.channel as TextChannel).send({ embeds: interaction.message.embeds });
};

export const displayTodayResult = async (interaction: ButtonInteraction) => {
  await interaction.deferUpdate();
  await interaction.deleteReply();
  const author = getMemberInfo(interaction, (name) => `${name}くんの今日の運勢`);
  const embeds = [buildEmbed(author, interaction.message.content.split('**')[1]!, 'success')];
  await (interaction.channel as TextChannel).send({ embeds });
};

export const sendTotalResult = async (interaction: RepliableInteraction) => {
  if ((await checkTargetChannel(interaction)) === null) {
    return;
  }
  const resultEntries = await Total.resultEntries;
  const total = resultEntries.reduce((pre, [, count]) => pre + count, 0);
  const title = `今までの全${total}回のおみくじは何が出たかなー？`;
  const description = resultEntries
    .filter(([, count]) => count > 0)
    .map(([luck, count]) => `${omikuji[luck]}: ${count}回`)
    .join('\n');
  const embeds = [buildEmbed(title, description)];
  await interaction.reply({ embeds });
};
