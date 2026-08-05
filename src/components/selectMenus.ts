import type { SelectMenuRegistration } from 'disbord';
import * as calendar from '@/modules/calendar';

export default {
  year: {
    component: (years: number[]) => ({
      options: years.map((year) => ({ label: `${year}年`, value: `${year}`, default: Math.max(...years) === year })),
    }),
    execute: async (interaction) => calendar.selectYear(interaction),
  },
  month: {
    component: (months: number[]) => ({
      options: months.map((month) => ({
        label: `${month}月`,
        value: `${month}`,
        default: Math.max(...months) === month,
      })),
    }),
    execute: async (interaction) => calendar.selectMonth(interaction),
  },
} satisfies SelectMenuRegistration;
