import { format, startOfWeek, addDays, addWeeks, subWeeks, differenceInMonths, differenceInYears } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export const getWeekStart = (date: Date = new Date()): Date => {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
};

export const getWeekDays = (weekStart: Date): Date[] =>
  Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));

export const formatWeekLabel = (weekStart: Date): string => {
  const end = addDays(weekStart, 4);
  return `${format(weekStart, 'yyyy年M月d日')} — ${format(end, 'M月d日')}`;
};

export const formatDateHeader = (date: Date): string =>
  format(date, 'M/d (EEE)', { locale: zhTW });

export const weekStartToKey = (weekStart: Date): string =>
  format(weekStart, 'yyyy-MM-dd');

export const nextWeek = (weekStart: Date): Date => addWeeks(weekStart, 1);
export const prevWeek = (weekStart: Date): Date => subWeeks(weekStart, 1);

export const formatSeniority = (startDate: string): string => {
  const start = new Date(startDate);
  const now = new Date();
  const years = differenceInYears(now, start);
  const months = differenceInMonths(now, start) % 12;
  if (years === 0) return `${months}個月`;
  if (months === 0) return `${years}年`;
  return `${years}年${months}個月`;
};

export const isoToDate = (iso: string): Date => new Date(iso);
