import { describe, expect, test } from 'bun:test';
import { generateCalendar } from '@/modules/calendar/calendarGeneration';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('generateCalendar', () => {
  test('PNG形式のBufferを返す', async () => {
    const buffer = await generateCalendar(2025, 1, [
      { day: 1, omikuji: 'chukichi' },
      { day: 2, omikuji: 'kichi' },
      { day: 3, omikuji: 'syokichi' },
      { day: 6, omikuji: 'suekichi' },
      { day: 7, omikuji: 'kyo' },
      { day: 8, omikuji: 'daikyo' },
      { day: 9, omikuji: 'daikichi' },
      { day: 10, omikuji: 'kira' },
      { day: 11, omikuji: 'yoshida' },
    ]);
    await Bun.write('.disbord/output.png', buffer);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 8)).toEqual(PNG_SIGNATURE);
  });
});
