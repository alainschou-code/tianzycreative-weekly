import { useState } from 'react';
import { getWeekStart, getWeekDays, nextWeek, prevWeek, weekStartToKey } from '../utils/dateUtils';

export function useCurrentWeek() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart());

  return {
    weekStart,
    weekDays: getWeekDays(weekStart),
    weekKey: weekStartToKey(weekStart),
    goNext: () => setWeekStart(d => nextWeek(d)),
    goPrev: () => setWeekStart(d => prevWeek(d)),
    goToday: () => setWeekStart(getWeekStart()),
  };
}
