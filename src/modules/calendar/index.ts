import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  RepliableInteraction,
  TextChannel,
} from 'discord.js';
import { User } from '../../db/User';
import { generateCalendar } from './calendarGeneration';
import { makeButtonRow } from '../../utils';
import { checkTargetChannel } from '../guild';

const flags = MessageFlags.Ephemeral;

export const callCalendarSelections = async (interaction: RepliableInteraction) => {
  if ((await checkTargetChannel(interaction)) === null) {
    return;
  }
  const user = await User.find({ discordId: interaction.user.id });
  if (user === null) {
    await interaction.reply({ content: 'まずはおみくじを引いてね', flags });
    return;
  }
  const years = extractDurations(user);
  const year = years.length === 1 ? years[0] : undefined;
  const components = generateDurationButtons(user, year);
  await interaction.reply({ content: 'いつのやつが見たいのー？', components, flags });
};

export const selectYear = async (interaction: ButtonInteraction) => {
  const user = (await User.find({ discordId: interaction.user.id }))!;
  const year = Number(interaction.customId.split('-')[1]);
  const components = generateDurationButtons(user, year);
  await interaction.update({ content: `${year}年の何月なんだねー？`, components });
};

export const selectMonth = async (interaction: ButtonInteraction) => {
  const user = (await User.find({ discordId: interaction.user.id }))!;
  const [year, month] = interaction.customId.split('-').slice(1).map(Number);
  const image = await generateCalendar(year, month, user.result);
  const attachment = new AttachmentBuilder(image, { name: 'calendar.png' });
  const content = `${year}/${month} のやつだねー。共有するならボタンを押してねー`;
  const components = [makeButtonRow('shareCalendar')];
  await interaction.update({ content, files: [attachment], components });
};

export const generateDurationButtons = (user: User, year?: number) => {
  const monthRows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (const duration of extractDurations(user, year)) {
    if (monthRows.length === 0 || monthRows[monthRows.length - 1].components.length === 5) {
      monthRows.push(new ActionRowBuilder<ButtonBuilder>());
    }
    const component = new ButtonBuilder()
      .setCustomId(`${year === undefined ? 'year' : `month-${year}`}-${duration}`)
      .setLabel(`${duration}${year === undefined ? '年' : '月'}`)
      .setStyle(ButtonStyle.Primary);
    monthRows[monthRows.length - 1].addComponents(component);
  }
  return monthRows;
};

const extractDurations = (user: User, year?: number) => {
  const days = Object.keys(user.result);
  const prefix = year === undefined ? '' : `${year}`;
  const durationIndex = year === undefined ? 0 : 1;
  return days
    .filter((day) => day.startsWith(prefix))
    .map((day) => day.split('-')[durationIndex])
    .filter((day, index, self) => self.indexOf(day) === index)
    .map(Number);
};

export const shareCalendar = async (interaction: ButtonInteraction) => {
  const { channel, member, message } = interaction;
  if (!(channel instanceof TextChannel) || !(member instanceof GuildMember)) {
    await interaction.reply({ content: 'ここでは共有できないよ', flags });
    return;
  }
  const originalAttachment = message.attachments.first();
  if (!originalAttachment) {
    await interaction.reply({ content: '画像が見つからないよ', flags });
    return;
  }
  const response = await fetch(originalAttachment.url);
  const buffer = Buffer.from(await response.arrayBuffer());
  const newAttachment = new AttachmentBuilder(buffer, { name: 'calendar.png' });
  const displayName = member.displayName;
  const avatarUrl = member.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({ name: `${displayName}くんのカレンダー`, iconURL: avatarUrl })
    .setImage('attachment://calendar.png') // 添付ファイルを参照
    .setColor(0x53fc94);
  await channel.send({ embeds: [embed], files: [newAttachment] });
  await interaction.update({ content: '共有したよー！', components: [], attachments: [] });
};
