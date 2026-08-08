import type { ButtonRegistration } from 'disbord';
import * as calendar from '@/modules/calendar';
import * as user from '@/modules/user';

export default {
  draw: {
    component: { label: '今日の運勢を占う', style: 'primary' },
    execute: async (interaction) => user.draw(interaction),
  },
  checkCounts: {
    component: { label: '今まで何をひいてきたかな？', style: 'secondary' },
    execute: async (interaction) => user.checkCounts(interaction),
  },
  todayResult: {
    component: { label: 'チャンネルに今日の運勢を送信する', style: 'secondary' },
    execute: async (interaction) => user.displayTodayResult(interaction),
  },
  noticeCounts: {
    component: { label: '今までの軌跡をみんなに共有する', style: 'secondary' },
    execute: async (interaction) => user.shareEmbed(interaction),
  },
  shareMonthCounts: {
    component: (year: number, month: number) => ({
      label: `${year}年${month}月の軌跡をみんなに共有する`,
      style: 'secondary',
    }),
    execute: async (interaction) => user.shareEmbed(interaction),
  },
  calendar: {
    component: { label: 'カレンダー見ちゃおっかな', style: 'secondary' },
    execute: async (interaction) => calendar.callCalendarSelections(interaction),
  },
  submitCalendar: {
    component: { label: 'カレンダー出しちゃう', style: 'primary' },
    execute: async (interaction) => calendar.submitCalendar(interaction),
  },
  shareCalendar: {
    component: { label: 'このカレンダーを見せびらかしちゃう', style: 'secondary' },
    execute: async (interaction) => calendar.shareCalendar(interaction),
  },
} satisfies ButtonRegistration;
