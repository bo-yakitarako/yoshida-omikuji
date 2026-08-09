import dayjs from 'dayjs';
import { Result } from '@/db/models/Result';
import { User } from '@/db/models/User';

export default async function () {
  const users = await User.findMany();
  for (const user of users) {
    const results = (await Result.findMany({ userId: user.id })).sort((a, b) => (b.date.isAfter(a.date) ? 1 : -1));
    const streak = calcStreak(results);
    const maxStreak = calcMaxStreak(results);
    await user.update({ streak, maxStreak });
  }
}

const calcStreak = (results: Result[]) => {
  const today = dayjs();
  if (results.length === 0 || !results[0]!.date.isSame(today, 'date')) {
    return 0;
  }
  let streak = 0;
  let targetDate = today;
  for (const result of results) {
    if (!result.date.isSame(targetDate, 'date')) {
      break;
    }
    streak += 1;
    targetDate = targetDate.subtract(1, 'day');
  }
  return streak;
};

const calcMaxStreak = (results: Result[]) => {
  if (results.length === 0) {
    return 0;
  }
  let maxStreak = 0;
  let currentStreak = 0;
  let targetDate = results[0]!.date;
  for (const result of results) {
    if (result.date.isSame(targetDate, 'date')) {
      currentStreak += 1;
    } else {
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
      currentStreak = 0;
    }
    targetDate = result.date.subtract(1, 'day');
  }
  if (currentStreak > maxStreak) {
    maxStreak = currentStreak;
  }
  return maxStreak;
};
