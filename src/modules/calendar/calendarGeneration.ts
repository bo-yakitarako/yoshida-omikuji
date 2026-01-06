import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import { omikuji, Omikuji } from '../../db/User';
import path from 'path';
import dayjs from 'dayjs';
import { fetchHolidays } from './holidays';

const fontPath = path.join(process.cwd(), 'assets/Hangyaku.ttf');
GlobalFonts.registerFromPath(fontPath, 'Hangyaku');

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
 * カレンダー画像を生成
 * @param year 年
 * @param month 月（1-12）
 * @returns 画像のBuffer
 */
export const generateCalendar = async (
  year: number,
  month: number,
  days: { [date in string]: Omikuji },
): Promise<Buffer> => {
  const basePath = path.join(process.cwd(), 'assets/calendar_base.png');
  const baseImage = await loadImage(basePath);

  const canvas = createCanvas(baseImage.width, baseImage.height);
  const ctx = canvas.getContext('2d');

  ctx.drawImage(baseImage, 0, 0);

  const yearMonthText = `${year} / ${String(month).padStart(2, '0')}`;
  ctx.font = 'bold 72px sans-serif';
  ctx.fillStyle = black;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(yearMonthText, 511, 122);

  const firstDay = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  const startDayOfWeek = firstDay.day(); // 0=日曜日, 6=土曜日
  const daysInMonth = firstDay.daysInMonth();
  const holidays = await fetchHolidays(year, month);

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayOfWeek = (startDayOfWeek + day - 1) % 7;
    const col = dayOfWeek;
    const row = Math.floor((startDayOfWeek + day - 1) / 7);

    const { x, y } = getCellPosition(col, row);

    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    const gap = 4;
    ctx.strokeText(String(day), x + GRID.cellSize - gap, y + gap);
    ctx.fillStyle = getDayColor(dayOfWeek, holidays.includes(day));
    ctx.fillText(String(day), x + GRID.cellSize - gap, y + gap);
    console.log(ctx.fillStyle, day, x, y);

    const omikujiKey = days[dateStr];
    if (omikujiKey) {
      const omikujiText = omikuji[omikujiKey];
      ctx.font = 'bold 56px Hangyaku';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 2;
      ctx.fillStyle = OMIKUJI_COLORS[omikujiKey];
      ctx.fillText(omikujiText, x + GRID.cellSize / 2, y + GRID.cellSize / 2 + 5);
    }
  }

  return canvas.toBuffer('image/png');
};
