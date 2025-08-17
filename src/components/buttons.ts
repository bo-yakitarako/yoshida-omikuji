import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import * as user from '../modules/user';

const registration = {
  draw: {
    component: new ButtonBuilder()
      .setCustomId('draw')
      .setLabel('今日の運勢を占う')
      .setStyle(ButtonStyle.Primary),
    async execute(interaction: ButtonInteraction) {
      await user.draw(interaction);
    },
  },
  checkCounts: {
    component: new ButtonBuilder()
      .setCustomId('checkCounts')
      .setLabel('今まで何をひいてきたかな？')
      .setStyle(ButtonStyle.Secondary),
    async execute(interaction: ButtonInteraction) {
      await user.checkCounts(interaction);
    },
  },
  todayResult: {
    component: new ButtonBuilder()
      .setCustomId('todayResult')
      .setLabel('チャンネルに今日の運勢を送信する')
      .setStyle(ButtonStyle.Secondary),
    async execute(interaction: ButtonInteraction) {
      await user.displayTodayResult(interaction);
    },
  },
  noticeCounts: {
    component: new ButtonBuilder()
      .setCustomId('noticeCounts')
      .setLabel('今までの軌跡をみんなに共有する')
      .setStyle(ButtonStyle.Secondary),
    async execute(interaction: ButtonInteraction) {
      await user.noticeCounts(interaction);
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
