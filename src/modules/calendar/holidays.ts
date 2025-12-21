import fs from 'fs';
import path from 'path';

const HOLIDAYS_API_URL = 'https://holidays-jp.github.io/api/v1/date.json';
const HOLIDAYS_JSON_PATH = path.join(process.cwd(), 'holidays.json');

type HolidaysData = Record<string, string>;

const loadLocalHolidays = (): HolidaysData | null => {
  try {
    if (fs.existsSync(HOLIDAYS_JSON_PATH)) {
      const data = fs.readFileSync(HOLIDAYS_JSON_PATH, 'utf-8');
      return JSON.parse(data) as HolidaysData;
    }
  } catch {
    // ファイルが存在しないか読み込みエラー
  }
  return null;
};

const saveLocalHolidays = (data: HolidaysData): void => {
  fs.writeFileSync(HOLIDAYS_JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

const fetchFromApi = async (): Promise<HolidaysData> => {
  const response = await fetch(HOLIDAYS_API_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch holidays: ${response.status}`);
  }
  return (await response.json()) as HolidaysData;
};

const hasDataForMonthOrLater = (data: HolidaysData, year: number, month: number): boolean => {
  const targetYearMonth = year * 100 + month; // YYYYMM形式の数値
  return Object.keys(data).some((dateStr) => {
    const [y, m] = dateStr.split('-').map(Number);
    const yearMonth = y * 100 + m;
    return yearMonth >= targetYearMonth;
  });
};

/**
 * 指定した年月の祝日の日付（数字）の配列を取得
 * @param year 年
 * @param month 月（1-12）
 * @returns 祝日の日付の配列（例: [1, 13]）
 */
export const fetchHolidays = async (year: number, month: number): Promise<number[]> => {
  let holidays = loadLocalHolidays();

  // holidays.jsonがないか、該当月以降のデータがない場合はAPIからfetch
  if (holidays === null || !hasDataForMonthOrLater(holidays, year, month)) {
    const fetchedHolidays = await fetchFromApi();
    holidays = { ...holidays, ...fetchedHolidays };
    saveLocalHolidays(holidays);
  }

  // 該当月の祝日を抽出
  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
  const holidayDays = Object.keys(holidays)
    .filter((dateStr) => dateStr.startsWith(monthPrefix))
    .map((dateStr) => {
      const day = dateStr.split('-')[2];
      return parseInt(day, 10);
    });

  return holidayDays;
};
