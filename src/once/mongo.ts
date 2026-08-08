import fs from 'fs';
import path from 'path';
import type { Collection, Document } from 'mongodb';
import { MongoClient } from 'mongodb';
import type { Omikuji } from '@/db/models/User';

type MongoUser = {
  discordId: string;
  result: { [date in string]: Omikuji };
};

type MongoNoticeChannel = {
  guildId: string;
  channelId: string;
};

export default async function () {
  const mongoUsers = await connect<MongoUser, MongoUser[]>('users', (collection) => collection.find().toArray());
  const mongoNoticeChannels = await connect<MongoNoticeChannel, MongoNoticeChannel[]>('notice_channels', (collection) =>
    collection.find().toArray(),
  );
  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  fs.writeFileSync(path.join(outputDir, 'mongoUsers.json'), JSON.stringify(mongoUsers, null, 2));
  fs.writeFileSync(path.join(outputDir, 'mongoNoticeChannels.json'), JSON.stringify(mongoNoticeChannels, null, 2));
}

async function connect<T extends Document, K>(
  collectionName: string,
  fn: (collection: Collection<T>) => Promise<K>,
): Promise<K> {
  // oxlint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    const client = new MongoClient(process.env.MONGO_URI as string);
    try {
      const db = client.db(process.env.MONGO_DB_NAME as string);
      const collection = db.collection<T>(collectionName);
      const result = await fn(collection);
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      await client.close();
    }
  });
}
