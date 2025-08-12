import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';
import * as guild from '../modules/guild';

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
