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
  const content = `共有するならボタンを押してねー`;
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

const extractDurations = (user: User, year?: number) =>
  Object.keys(user.result)
    .filter((day) => day.startsWith(year === undefined ? '' : `${year}`))
    .map((day) => day.split('-')[year === undefined ? 0 : 1])
    .filter((day, index, self) => self.indexOf(day) === index)
    .map(Number);

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
  await interaction.deferUpdate();
  const response = await fetch(originalAttachment.url);
  await interaction.deleteReply();
  const buffer = Buffer.from(await response.arrayBuffer());
  const newAttachment = new AttachmentBuilder(buffer, { name: 'calendar.png' });
  const iconURL = member.displayAvatarURL();
  const embed = new EmbedBuilder()
    .setAuthor({ name: `${member.displayName}くんのカレンダー`, iconURL })
    .setImage('attachment://calendar.png')
    .setColor(0x53fc94);
  await channel.send({ embeds: [embed], files: [newAttachment] });
};
