import type { SlashCommandRegistration } from 'disbord';
import * as calendar from '@/modules/calendar';
import * as guild from '@/modules/guild';
import * as user from '@/modules/user';

export default {
  notice: {
    description: 'このチャンネルに通知するよ',
    execute: async (interaction) => guild.setNoticeChannel(interaction),
  },
  clear: {
    description: '通知先を解除するよ',
    execute: async (interaction) => guild.clearNotice(interaction),
  },
  manual: async (interaction) => guild.sendNoticeManually(interaction),
  omikuji: {
    description: 'おみくじを引くよ',
    execute: async (interaction) => user.draw(interaction),
  },
  counts: async (interaction) => user.checkCounts(interaction),
  month: {
    description: '指定月のおみくじ回数を見るよ(指定無しは今月のやつ)',
    options: [
      { type: 'integer', name: 'year', description: '年' },
      { type: 'integer', name: 'month', description: '月' },
    ],
    execute: async (interaction) => user.checkMonthCounts(interaction),
  },
  total: async (interaction) => user.sendTotalResult(interaction),
  calendar: async (interaction) => calendar.callCalendarSelections(interaction),
} satisfies SlashCommandRegistration;
