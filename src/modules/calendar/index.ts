import dayjs from 'dayjs';
import type { RepliableInteraction, ButtonInteraction, StringSelectMenuInteraction } from 'disbord';
import { makeButtonRow, makeSelectMenuRow } from 'disbord';
import { buildEmbed, getMemberInfo } from 'disbord/utils';
import { AttachmentBuilder, GuildMember, TextChannel, type TopLevelComponent } from 'discord.js';
import { Result } from '@/db/models/Result';
import { User } from '@/db/models/User';
import { generateCalendar } from '@/modules/calendar/calendarGeneration';
import { checkTargetChannel } from '@/modules/guild';

export const callCalendarSelections = async (interaction: RepliableInteraction) => {
  if ((await checkTargetChannel(interaction)) === null) {
    return;
  }
  const user = await User.find({ discordId: interaction.user.id });
  if (user === null) {
    await interaction.ephemeral('1回占ってこようねー');
    return;
  }
  const today = dayjs();
  const [year, month] = [today.year(), today.month() + 1];
  const components = [
    makeSelectMenuRow('year', await extractDurations(interaction)),
    makeSelectMenuRow('month', await extractDurations(interaction, year)),
    makeButtonRow(['submitCalendar', year, month]),
  ];
  await interaction.ephemeral({ content: 'いつのやつが見たいのー？', components });
};

export const selectYear = async (interaction: StringSelectMenuInteraction) => {
  const selectedYear = parseInt(interaction.values[0]!);
  const id = interaction.user.id;
  monthSelection[id] ??= {};
  const selection = monthSelection[id];
  const months = await extractDurations(interaction, selectedYear);
  if (selection?.year !== undefined && selectedYear !== selection.year && !months.includes(selection?.month ?? -1)) {
    selection.month = undefined;
  }
  monthSelection[id].year = selectedYear;
  const prevComponents = interaction.message.components;
  const components = [
    prevComponents[0],
    makeSelectMenuRow('month', months),
    makeButtonRow(['submitCalendar', selectedYear, monthSelection[id].month ?? months[months.length - 1]!]),
  ] as TopLevelComponent[];
  const { content, embeds } = interaction.message;
  await interaction.update({ content, embeds, components });
};

export const selectMonth = async (interaction: StringSelectMenuInteraction) => {
  const selectedMonth = parseInt(interaction.values[0]!);
  const id = interaction.user.id;
  monthSelection[id] ??= {};
  monthSelection[id].month = selectedMonth;
  const prevComponents = interaction.message.components;
  const year = monthSelection[id].year ?? dayjs().year();
  const components = [
    ...prevComponents.slice(0, 2),
    makeButtonRow(['submitCalendar', year, selectedMonth]),
  ] as TopLevelComponent[];
  const { content, embeds } = interaction.message;
  await interaction.update({ content, embeds, components });
};

const monthSelection: { [id in string]: { year?: number; month?: number } } = {};

const extractDurations = async (interaction: RepliableInteraction, year?: number) => {
  const discordId = interaction.user.id;
  const today = dayjs();
  const selection = monthSelection[discordId];
  const query = {
    discordId,
    year: year ?? selection?.year ?? today.year(),
    month: selection?.month ?? today.month() + 1,
  };
  const results = await Result.findDistinct([year ? 'month' : 'year'], query);
  return results.map((r) => (year ? r.month : r.year)).sort((a, b) => a - b);
};

export const submitCalendar = async (interaction: ButtonInteraction) => {
  const id = interaction.user.id;
  const today = dayjs();
  const year = monthSelection[id]?.year ?? today.year();
  const month = monthSelection[id]?.month ?? today.month() + 1;
  const dayResults = await Result.findMany({ userId: id, year, month });
  const days = dayResults.map((r) => ({ day: r.day, omikuji: r.result }));
  const calendarBuffer = await generateCalendar(year, month, days);
  const attachment = new AttachmentBuilder(calendarBuffer, { name: 'calendar.png' });
  const author = getMemberInfo(interaction, (name) => `${name}くんのカレンダー`);
  const embed = buildEmbed(author, '', 'success').setImage('attachment://calendar.png');
  await interaction.ephemeral({ embeds: [embed], files: [attachment] });
};

export const shareCalendar = async (interaction: ButtonInteraction) => {
  const { channel, member, message } = interaction;
  if (!(channel instanceof TextChannel) || !(member instanceof GuildMember)) {
    await interaction.ephemeral('ここでは共有できないよ');
    return;
  }
  const originalAttachment = message.attachments.first();
  if (!originalAttachment) {
    await interaction.ephemeral('画像が見つからないよ');
    return;
  }
  await interaction.deferUpdate();
  const response = await fetch(originalAttachment.url);
  await interaction.deleteReply();
  const buffer = Buffer.from(await response.arrayBuffer());
  const newAttachment = new AttachmentBuilder(buffer, { name: 'calendar.png' });
  const author = getMemberInfo(interaction, (name) => `${name}くんのカレンダー`);
  const embed = buildEmbed(author, '', 'success').setImage('attachment://calendar.png');
  await channel.send({ embeds: [embed], files: [newAttachment] });
};
