import { ButtonBuilder, ButtonInteraction, ButtonStyle, MessageFlags } from 'discord.js';

const flags = MessageFlags.Ephemeral;

const registration = {
  button: {
    component: new ButtonBuilder()
      .setCustomId('button')
      .setLabel('コモドドラゴンのメス')
      .setStyle(ButtonStyle.Primary),
    async execute(interaction: ButtonInteraction) {
      await interaction.reply({ content: 'これが本当のけものフレンズ', flags });
    },
  },
};

type CustomId = keyof typeof registration;

export const button = Object.fromEntries(
  (Object.keys(registration) as CustomId[]).map((id) => [id, registration[id].component] as const),
) as { [key in CustomId]: ButtonBuilder };

export const buttonInteraction = async (interaction: ButtonInteraction) => {
  const customId = interaction.customId as CustomId;
  await registration[customId].execute(interaction);
};
