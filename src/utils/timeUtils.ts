export const SLOT_HEIGHT = 56; // px per 30-min slot (static fallback only)
export const BREAK_HEIGHT = 36; // px for lunch break row
export const MORNING_SLOTS = 6; // 09:00–12:00
export const AFTERNOON_SLOTS = 10; // 13:30–18:30
export const TOTAL_SLOTS = 16;

export const TIME_LABELS: string[] = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00',
];

export const slotToLabel = (slot: number): string => TIME_LABELS[slot] ?? '';

export const slotToEndLabel = (slot: number): string => TIME_LABELS[slot + 1] ?? (slot === 15 ? '18:30' : '');

export const slotToY = (slot: number, slotH = SLOT_HEIGHT): number => {
  if (slot < MORNING_SLOTS) return slot * slotH;
  return MORNING_SLOTS * slotH + BREAK_HEIGHT + (slot - MORNING_SLOTS) * slotH;
};

export const yToSlot = (relY: number, slotH = SLOT_HEIGHT): number => {
  const morningEnd = MORNING_SLOTS * slotH;
  const afternoonStart = morningEnd + BREAK_HEIGHT;

  if (relY < 0) return 0;
  if (relY < morningEnd) {
    return Math.min(MORNING_SLOTS - 1, Math.floor(relY / slotH));
  }
  if (relY < afternoonStart) return MORNING_SLOTS - 1;
  const afterBreak = relY - afternoonStart;
  return Math.min(TOTAL_SLOTS - 1, MORNING_SLOTS + Math.floor(afterBreak / slotH));
};

export const totalGridHeight = TOTAL_SLOTS * SLOT_HEIGHT + BREAK_HEIGHT;

export const formatDuration = (slots: number): string => {
  const totalMins = slots * 30;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}小時`;
  return `${h}小時${m}分`;
};

export const ITEM_COLORS = [
  '#4A90D9', '#5BB974', '#E8935A', '#9B7FD4',
  '#E05C5C', '#4ABCB4', '#F0C74D', '#E06FAA',
];

export const DAY_NAMES = ['週一', '週二', '週三', '週四', '週五'];
