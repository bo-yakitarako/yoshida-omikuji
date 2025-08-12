import { Model } from './Model';

type Props = {
  guildId: string;
  channelId: string;
};

export class NoticeChannel extends Model<Props> {
  protected static _collectionName = 'notice_channels';

  public get guildId() {
    return this._data.guildId;
  }

  public get channelId() {
    return this._data.channelId;
  }
}
