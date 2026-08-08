import type { Config } from 'disbord';

export default {
  intents: ['Guilds', 'GuildMessages'],
  db: {
    enable: true,
  },
  timer: {
    notice: '*-*-* 00:00',
  },
  botErrorMessage: 'エラーが発生しました',
} satisfies Config;
