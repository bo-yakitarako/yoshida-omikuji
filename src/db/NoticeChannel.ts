import { Model } from './Model';

export class NoticeChannel extends Model<{ guildId: string; channelId: string }> {
  protected static _collectionName = 'notice_channels';

  public get guildId() {
    return this._data.guildId;
  }

  public get channelId() {
    return this._data.channelId;
  }
}
