import type { WorkItem } from '../../types';
import {
  SLOT_HEIGHT, BREAK_HEIGHT, MORNING_SLOTS, TOTAL_SLOTS,
  DAY_NAMES, TIME_LABELS, slotToY,
} from '../../utils/timeUtils';
import { formatDateHeader } from '../../utils/dateUtils';
import { WorkItemCard } from '../WeeklyCalendar/WorkItemCard';

interface Props {
  weekDays: Date[];
  items: WorkItem[];
}

export function WeekCalendarView({ weekDays, items }: Props) {
  const slotH = SLOT_HEIGHT;
  const gridH = slotH * TOTAL_SLOTS + BREAK_HEIGHT;

  return (
    <div className="calendar-wrap">
      <div className="calendar-header">
        <div className="time-gutter" />
        {weekDays.map((date, i) => (
          <div key={i} className="day-header">
            <span className="day-name">{DAY_NAMES[i]}</span>
            <span className="day-date">{formatDateHeader(date)}</span>
          </div>
        ))}
      </div>

      {/* overflow: visible lets .report-detail handle scrolling */}
      <div
        className="calendar-body"
        style={{ overflow: 'visible', flex: 'none' }}
      >
        <div className="time-gutter" style={{ height: gridH }}>
          {TIME_LABELS.map((label, i) => (
            <div key={label} className="time-label" style={{ top: slotToY(i, slotH) }}>
              {label}
            </div>
          ))}
          <div className="break-label" style={{ top: MORNING_SLOTS * slotH }}>午休</div>
        </div>

        {weekDays.map((_, dayIdx) => {
          const dayItems = items.filter(i => i.day === dayIdx);
          return (
            <div key={dayIdx} className="day-column" style={{ height: gridH }}>
              {Array.from({ length: TOTAL_SLOTS }, (_, s) => (
                <div
                  key={s}
                  className={`slot-line${s === MORNING_SLOTS ? ' after-morning' : ''}`}
                  style={{ top: slotToY(s, slotH) + (s === MORNING_SLOTS ? BREAK_HEIGHT : 0) }}
                />
              ))}
              <div className="break-sep" style={{ top: MORNING_SLOTS * slotH }} />
              {dayItems.map(item => (
                <WorkItemCard
                  key={item.id}
                  item={item}
                  isDragging={false}
                  onPointerDown={e => e.preventDefault()}
                  onResizePointerDown={e => e.preventDefault()}
                  onClick={() => {}}
                  onToggleComplete={() => {}}
                  onCopy={() => {}}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
