import { ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import * as user from '../modules/user';
import * as calendar from '../modules/calendar';

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
  calendar: {
    component: new ButtonBuilder()
      .setCustomId('calendar')
      .setLabel('カレンダー見ちゃおっかな')
      .setStyle(ButtonStyle.Secondary),
    async execute(interaction: ButtonInteraction) {
      await calendar.callCalendarSelections(interaction);
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
  shareCalendar: {
    component: new ButtonBuilder()
      .setCustomId('shareCalendar')
      .setLabel('このカレンダーを見せびらかしちゃう')
      .setStyle(ButtonStyle.Secondary),
    async execute(interaction: ButtonInteraction) {
      await calendar.shareCalendar(interaction);
    },
  },
};

type CustomId = keyof typeof registration;

export const button = Object.fromEntries(
  (Object.keys(registration) as CustomId[]).map((id) => [id, registration[id].component] as const),
) as { [key in CustomId]: ButtonBuilder };

export const buttonInteraction = async (interaction: ButtonInteraction) => {
  const customId = interaction.customId;
  if (['year', 'month', 'shareMonthCounts'].some((prefix) => customId.startsWith(prefix))) {
    if (customId.startsWith('year')) {
      await calendar.selectYear(interaction);
    } else if (customId.startsWith('month')) {
      await calendar.selectMonth(interaction);
    } else {
      await user.shareMonthCounts(interaction);
    }
    return;
  }
  await registration[customId as CustomId].execute(interaction);
};
