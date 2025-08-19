import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import * as guild from '../modules/guild';
import * as user from '../modules/user';

const flags = MessageFlags.Ephemeral;

const registration = {
  notice: {
    data: new SlashCommandBuilder().setName('notice').setDescription('このチャンネルに通知するよ'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await guild.setNoticeChannel(interaction);
    },
  },
  clear: {
    data: new SlashCommandBuilder().setName('clear').setDescription('通知先を解除するよ'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await guild.clearNotice(interaction);
    },
  },
  manual: {
    data: new SlashCommandBuilder().setName('manual').setDescription('おみくじボタンの再送信'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await guild.sendNoticeManually(interaction);
    },
  },
  omikuji: {
    data: new SlashCommandBuilder().setName('omikuji').setDescription('おみくじを引くよ'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await user.draw(interaction);
    },
  },
  counts: {
    data: new SlashCommandBuilder().setName('counts').setDescription('おみくじの回数を確認するよ'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await user.checkCounts(interaction);
    },
  },
  total: {
    data: new SlashCommandBuilder().setName('total').setDescription('今までの全おみくじを見るよ'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await user.sendTotalResult(interaction);
    },
  },
};

type CommandName = keyof typeof registration;

export const commands = Object.values(registration).map(({ data }) => data.toJSON());
export const slashCommandsInteraction = async (interaction: ChatInputCommandInteraction) => {
  if (!(interaction.channel instanceof TextChannel)) {
    await interaction.reply({ content: 'ほ？', flags });
    return;
  }
  const commandName = interaction.commandName as CommandName;
  await registration[commandName].execute(interaction);
};
