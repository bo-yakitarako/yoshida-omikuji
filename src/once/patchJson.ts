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
  const usersJson = (await import('../../output/mongoUsers.json')).default; // oxlint-disable-line no-restricted-imports
  const noticeChannelsJson = (await import('../../output/mongoNoticeChannels.json')).default; // oxlint-disable-line no-restricted-imports
  await NoticeChannel.create(noticeChannelsJson.map(({ guildId, channelId }) => ({ guildId, channelId })));
  const users = await User.create(
    usersJson.map(({ discordId, result }) => {
      const count = { ...omikujiDefault };
      for (const omikuji of Object.values(result) as Omikuji[]) {
        count[omikuji]++;
      }
      return { discordId, ...count };
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
