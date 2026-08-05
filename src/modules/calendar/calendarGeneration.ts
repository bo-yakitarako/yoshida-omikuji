import fs from 'fs';
import path from 'path';
import { PassThrough } from 'stream';
import dayjs from 'dayjs';
import * as PImage from 'pureimage';
import { omikuji, type Omikuji } from '@/db/models/User';
import { fetchHolidays } from '@/modules/calendar/holidays';

const FONT_FAMILY = 'Hangyaku';
const fontPath = path.join(process.cwd(), 'assets/Hangyaku.ttf');
PImage.registerFont(fontPath, FONT_FAMILY).loadSync();

const GRID = {
  startX: 65,
  startY: 193,
  cellSize: 125,
  lineWidth: 3,
} as const;

const black = '#333333';
const COLORS = {
  weekday: black, // 平日：黒
  saturday: '#0066CC', // 土曜日：青
  sunday: '#CC0000', // 日曜日：赤
  holiday: '#CC0000', // 祝日：赤
} as const;

const OMIKUJI_COLORS: Record<Omikuji, string> = {
  kira: '#CC0000', // 吉良吉影：赤
  yoshida: '#CC0000', // 吉田：赤
  daikichi: black,
  chukichi: black,
  kichi: black,
  syokichi: black,
  suekichi: black,
  kyo: black,
  daikyo: black,
};

/**
 * マスの座標を計算
 */
const getCellPosition = (col: number, row: number) => ({
  x: GRID.startX + col * (GRID.cellSize + GRID.lineWidth),
  y: GRID.startY + row * (GRID.cellSize + GRID.lineWidth),
});

/**
 * 曜日に応じた色を取得（0=日曜日, 6=土曜日）
 */
const getDayColor = (dayOfWeek: number, isHoliday: boolean): string => {
  if (dayOfWeek === 0) return COLORS.sunday;
  if (dayOfWeek === 6) return COLORS.saturday;
  if (isHoliday) return COLORS.holiday;
  return COLORS.weekday;
};

/**
 * Bitmapをpng形式のBufferにエンコードする
 */
const encodeToPngBuffer = async (bitmap: PImage.Bitmap): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  const stream = new PassThrough();
  stream.on('data', (chunk: Buffer) => chunks.push(chunk));
  await PImage.encodePNGToStream(bitmap, stream);
  return Buffer.concat(chunks);
};

/**
 * カレンダー画像を生成
 * @param year 年
 * @param month 月（1-12）
 * @returns 画像のBuffer
 */
export const generateCalendar = async (
  year: number,
  month: number,
  days: { day: number; omikuji: Omikuji }[],
): Promise<Buffer> => {
  const basePath = path.join(process.cwd(), 'assets/calendar_base.png');
  const baseImage = await PImage.decodePNGFromStream(fs.createReadStream(basePath));

  const canvas = PImage.make(baseImage.width, baseImage.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(baseImage, 0, 0);

  const yearMonthText = `${year} / ${String(month).padStart(2, '0')}`;
  ctx.font = `72px ${FONT_FAMILY}`;
  ctx.fillStyle = black;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(yearMonthText, 511, 122);

  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const startDayOfWeek = firstDay.day(); // 0=日曜日, 6=土曜日
  const daysInMonth = firstDay.daysInMonth();
  const holidays = await fetchHolidays(year, month);

  for (let date = 1; date <= daysInMonth; date++) {
    const dayOfWeek = (startDayOfWeek + date - 1) % 7;
    const col = dayOfWeek;
    const row = Math.floor((startDayOfWeek + date - 1) / 7);

    const { x, y } = getCellPosition(col, row);

    ctx.font = `28px ${FONT_FAMILY}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    const gap = 4;
    ctx.strokeText(String(date), x + GRID.cellSize - gap, y + gap);
    ctx.fillStyle = getDayColor(dayOfWeek, holidays.includes(date));
    ctx.fillText(String(date), x + GRID.cellSize - gap, y + gap);

    const omikujiKey = days.find(({ day }) => day == date)?.omikuji;
    if (omikujiKey) {
      const omikujiText = omikuji[omikujiKey];
      ctx.font = `56px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 2;
      ctx.fillStyle = OMIKUJI_COLORS[omikujiKey];
      ctx.fillText(omikujiText, x + GRID.cellSize / 2, y + GRID.cellSize / 2 + 5);
    }
  }

  return encodeToPngBuffer(canvas);
};
