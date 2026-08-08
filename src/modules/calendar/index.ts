import type { RepliableInteraction, ButtonInteraction, StringSelectMenuInteraction } from 'disbord';
import { makeButtonRow, makeSelectMenuRow } from 'disbord';
import { buildEmbed, getMemberInfo } from 'disbord/utils';
import { AttachmentBuilder, GuildMember, TextChannel } from 'discord.js';
import { Result } from '@/db/models/Result';
import { User } from '@/db/models/User';
import { generateCalendar } from '@/modules/calendar/calendarGeneration';
import { checkTargetChannel } from '@/modules/guild';

const monthSelection: { [id in string]: { year: number; month: number } } = {};
const calendarBuffers: { [id in string]: Buffer } = {};

export const callCalendarSelections = async (interaction: RepliableInteraction) => {
  if ((await checkTargetChannel(interaction)) === null) {
    return;
  }
  const user = await User.find({ discordId: interaction.user.id });
  if (user === null) {
    await interaction.ephemeral('1回占ってこようねー');
    return;
  }
  const years = await extractDurations(interaction);
  const year = years.at(-1)!;
  const months = await extractDurations(interaction, year);
  monthSelection[interaction.user.id] = { year, month: months.at(-1)! };
  const components = [
    makeSelectMenuRow('year', years),
    makeSelectMenuRow('month', months),
    makeButtonRow('submitCalendar'),
  ];
  await interaction.ephemeral({ content: 'いつのやつが見たいのー？', components });
};

export const selectYear = async (interaction: StringSelectMenuInteraction) => {
  const selectedYear = parseInt(interaction.values[0]!);
  const id = interaction.user.id;
  const selection = monthSelection[id]!;
  const months = await extractDurations(interaction, selectedYear);
  if (selectedYear !== selection.year && !months.includes(selection.month)) {
    selection.month = months.at(-1)!;
  }
  monthSelection[id]!.year = selectedYear;
  const years = await extractDurations(interaction);
  const components = [
    makeSelectMenuRow('year', years, selectedYear),
    makeSelectMenuRow('month', months, selection.month),
    makeButtonRow('submitCalendar'),
  ];
  const { content, embeds } = interaction.message;
  await interaction.update({ content, embeds, components });
};

export const selectMonth = async (interaction: StringSelectMenuInteraction) => {
  const selectedMonth = parseInt(interaction.values[0]!);
  const id = interaction.user.id;
  monthSelection[id]!.month = selectedMonth;
  await interaction.deferUpdate();
};

const extractDurations = async (interaction: RepliableInteraction, year?: number) => {
  const discordId = interaction.user.id;
  const query = { discordId, year };
  const results = await Result.findDistinct([year ? 'month' : 'year'], query);
  return results.map((r) => (year ? r.month : r.year)).sort((a, b) => a - b);
};

export const submitCalendar = async (interaction: ButtonInteraction) => {
  const id = interaction.user.id;
  const { year, month } = monthSelection[id]!;
  const dayResults = await Result.findMany({ discordId: id, year, month });
  const days = dayResults.map((r) => ({ day: r.day, omikuji: r.result }));
  const calendarBuffer = await generateCalendar(year, month, days);
  calendarBuffers[id] = calendarBuffer;
  const attachment = new AttachmentBuilder(calendarBuffer, { name: 'calendar.png' });
  const author = getMemberInfo(interaction, (name) => `${name}くんのカレンダー`);
  const embed = buildEmbed(author, '', 'success').setImage('attachment://calendar.png');
  await interaction.update({
    content: 'どんな感じかなー？',
    embeds: [embed],
    files: [attachment],
    components: [makeButtonRow('shareCalendar')],
  });
  delete monthSelection[id];
};

export const shareCalendar = async (interaction: ButtonInteraction) => {
  const { channel, member } = interaction;
  if (!(channel instanceof TextChannel) || !(member instanceof GuildMember)) {
    await interaction.ephemeral('ここでは共有できないよ');
    return;
  }
  const id = interaction.user.id;
  const calendarBuffer = calendarBuffers[id];
  if (!calendarBuffer) {
    await interaction.ephemeral('画像が見つからないよ');
    return;
  }
  await interaction.deferUpdate();
  await interaction.deleteReply();
  const newAttachment = new AttachmentBuilder(calendarBuffer, { name: 'calendar.png' });
  const author = getMemberInfo(interaction, (name) => `${name}くんのカレンダー`);
  const embed = buildEmbed(author, '', 'success').setImage('attachment://calendar.png');
  await channel.send({ embeds: [embed], files: [newAttachment] });
  delete calendarBuffers[id];
};
