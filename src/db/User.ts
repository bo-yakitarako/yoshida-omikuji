import dayjs from 'dayjs';
import { Model } from './Model';

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

  public buildCountDescription() {
    const totalCount = Object.keys(this.result).length;
    return (Object.entries(this.drawCount) as [Omikuji, number][])
      .filter(([, count]) => count > 0)
      .map(
        ([luck, count]) =>
          `${omikuji[luck]}: ${count}回 (${((count / totalCount) * 100).toFixed(0)}%)`,
      )
      .join('\n');
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
