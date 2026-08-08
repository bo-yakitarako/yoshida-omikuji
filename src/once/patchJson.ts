import fs from 'node:fs';
import path from 'node:path';
import dayjs from 'dayjs';
import { db } from 'disbord';
import { NoticeChannel } from '@/db/models/NoticeChannel';
import { Result } from '@/db/models/Result';
import { User, type Omikuji } from '@/db/models/User';
import { noticeChannel, result, user } from '@/db/schema';

const omikujiDefault: { [key in Omikuji]: number } = {
  kira: 0,
  yoshida: 0,
  daikichi: 0,
  chukichi: 0,
  kichi: 0,
  syokichi: 0,
  suekichi: 0,
  kyo: 0,
  daikyo: 0,
};

export default async function () {
  await db.delete(user);
  await db.delete(result);
  await db.delete(noticeChannel);
  const usersJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'output/mongoUsers.json'), 'utf-8')) as {
    discordId: string;
    result: { [date: string]: Omikuji };
  }[];
  const noticeChannelsJson = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'output/mongoNoticeChannels.json'), 'utf-8'),
  ) as { guildId: string; channelId: string }[];
  await NoticeChannel.create(noticeChannelsJson.map(({ guildId, channelId }) => ({ guildId, channelId })));
  const users = await User.create(
    usersJson.map(({ discordId, result }) => {
      const count = { ...omikujiDefault };
      let targetToday = dayjs();
      let streak = 0;
      let maxStreak = 0;
      for (const date of Object.keys(result).sort((a, b) => b.localeCompare(a))) {
        count[result[date as never] as Omikuji]++;
        const target = dayjs(date);
        if (target.isSame(targetToday, 'day')) {
          streak += 1;
        } else {
          if (streak > maxStreak) {
            maxStreak = streak;
          }
          streak = 0;
        }
        targetToday = target.subtract(1, 'day');
      }
      return { discordId, ...count, streak: maxStreak || streak || 1 };
    }),
  );
  const userIdMap = Object.fromEntries(users.map((user) => [user.discordId, user.id]));
  const records = usersJson.map(({ discordId, result }) =>
    (Object.entries(result) as [string, Omikuji][]).map(([date, omikuji]) => {
      const [year, month, day] = date.split('-').map(Number) as [number, number, number];
      return { userId: userIdMap[discordId]!, discordId, year, month, day, result: omikuji };
    }),
  );
  await Result.create(records.flat());
}
