import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
  TextChannel,
} from 'discord.js';

const flags = MessageFlags.Ephemeral;

const registration = {
  help: {
    data: new SlashCommandBuilder().setName('help').setDescription('たすけてくれ～'),
    execute: async (interaction: ChatInputCommandInteraction) => {
      await interaction.reply({ content: 'おぼぼぼぼ', flags });
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
