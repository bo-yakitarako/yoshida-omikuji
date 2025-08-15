import dayjs from 'dayjs';
import { Model } from './Model';

const omikuji = {
  yoshida: '吉田',
  daikichi: '大吉',
  chukichi: '中吉',
  kichi: '吉',
  syokichi: '小吉',
  suekichi: '末吉',
  kyo: '凶',
  daikyo: '大凶',
} as const;
const percentages = [1, 10, 30, 45, 60, 70, 90, 101] as const;
type Omikuji = keyof typeof omikuji;

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
    const omikujiKeys = Object.keys(omikuji) as Omikuji[];
    const random = Math.floor(Math.random() * 100);
    const keyIndex = percentages.findIndex((p) => p > random);
    const result = { ...this.result, [today]: omikujiKeys[keyIndex] };
    await this.update({ result });
    return { omikuji: omikuji[omikujiKeys[keyIndex]], success: true };
  }

  public buildCountDescription() {
    return (Object.entries(this.drawCount) as [Omikuji, number][])
      .filter(([, count]) => count > 0)
      .map(([luck, count]) => `${omikuji[luck]}: ${count}回`)
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
