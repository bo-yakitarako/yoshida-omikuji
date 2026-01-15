import dayjs from 'dayjs';
import { Model } from './Model';
import { RepliableInteraction } from 'discord.js';
import { buildEmbed, memberInfo } from '../utils';

export const omikuji = {
  kira: '吉良吉影',
  yoshida: '吉田',
  daikichi: '大吉',
  chukichi: '中吉',
  kichi: '吉',
  syokichi: '小吉',
  suekichi: '末吉',
  kyo: '凶',
  daikyo: '大凶',
};
const percentages = [3, 10, 100, 300, 450, 600, 700, 900, 1001] as const;
export type Omikuji = keyof typeof omikuji;

export class User extends Model<{ discordId: string; result: { [key: string]: Omikuji } }> {
  protected static _collectionName = 'users';

  public get discordId() {
    return this._data.discordId;
  }

  public get result() {
    return this._data.result;
  }

  public async draw() {
    const today = dayjs().format('YYYY-MM-DD');
    if (today in this.result) {
      return { omikuji: omikuji[this.result[today]], success: false };
    }
    if (this.discordId === process.env.YOSHIDA_USER_ID) {
      await this.update({ result: { ...this.result, [today]: 'yoshida' } });
      return { omikuji: '吉田', success: true };
    }
    const omikujiKeys = Object.keys(omikuji) as Omikuji[];
    const random = Math.floor(Math.random() * 1000);
    const keyIndex = percentages.findIndex((p) => p > random);
    const result = { ...this.result, [today]: omikujiKeys[keyIndex] };
    await this.update({ result });
    return { omikuji: omikuji[omikujiKeys[keyIndex]], success: true };
  }

  public buildCountEmged(interaction: RepliableInteraction) {
    const count = `(全${Object.keys(this.result).length}回)`;
    const author = memberInfo(interaction, (name) => `${name}くんの軌跡${count}`);
    const description = this.buildCountDescription();
    const fields = this.buildSequenceCountFields();
    return buildEmbed(author, description, fields);
  }

  private buildCountDescription() {
    const totalCount = Object.keys(this.result).length;
    return (Object.entries(this.drawCount) as [Omikuji, number][])
      .filter(([, count]) => count > 0)
      .map(
        ([luck, count]) =>
          `${omikuji[luck]}: ${count}回 (${((count / totalCount) * 100).toFixed(0)}%)`,
      )
      .join('\n');
  }

  private buildSequenceCountFields() {
    const count = this.sequenceCount;
    if (count === 0) {
      return [];
    }
    return [{ name: 'なんと今...', value: `**${count}日**連続おみくじ継続中！`, inline: false }];
  }

  private get sequenceCount() {
    const days = Object.keys(this.result).reverse();
    if (days.length === 0 || !dayjs(days[0]).isSame(dayjs(), 'date')) {
      return 0;
    }
    const count = days.findIndex(
      (day, i, array) => !dayjs(day).isSame(dayjs(array[i + 1]).add(1, 'day'), 'date'),
    );
    return count === 0 ? 0 : count + 1;
  }

  private get drawCount() {
    type Count = { [key in Omikuji]: number };
    const count = Object.fromEntries(Object.keys(omikuji).map((l) => [l, 0])) as Count;
    Object.values(this.result).forEach((luck) => count[luck]++);
    return count;
  }

  public get todayOmikuji() {
    const today = dayjs().format('YYYY-MM-DD');
    return omikuji[this.result[today]];
  }
}
