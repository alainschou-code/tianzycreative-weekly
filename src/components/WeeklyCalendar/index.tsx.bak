import { useState, useEffect, useRef, useCallback } from 'react';
import type { WorkItem } from '../../types';
import {
  SLOT_HEIGHT, BREAK_HEIGHT, MORNING_SLOTS, TOTAL_SLOTS,
  DAY_NAMES, TIME_LABELS, slotToY, yToSlot,
} from '../../utils/timeUtils';
import { formatDateHeader } from '../../utils/dateUtils';
import { WorkItemCard } from './WorkItemCard';
import { WorkItemModal } from './WorkItemModal';

// Reads the CSS-computed --slot-h value in pixels (always current)
const getCSSSlotH = (): number =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--slot-h')) || SLOT_HEIGHT;

interface DragState {
  itemId: string;
  type: 'move' | 'resize';
  grabOffset: number;
  previewDay: number;
  previewSlot: number;
  previewDuration: number;
  originalDay: number;
  originalSlot: number;
  originalDuration: number;
}

interface Props {
  weekDays: Date[];
  items: WorkItem[];
  projectNames: string[];
  onAdd: (item: WorkItem) => void;
  onUpdate: (id: string, patch: Partial<WorkItem>) => void;
  onRemove: (id: string) => void;
  loading: boolean;
}

function ProgressBar({ items }: { items: WorkItem[] }) {
  const total = items.length;
  const done = items.filter(i => i.completed).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="week-progress">
      <div className="progress-header">
        <span className="progress-label">本週進度</span>
        <span className="progress-fraction">{done} / {total} 項完成</span>
        <span className={`progress-pct${pct === 100 ? ' all-done' : ''}`}>{pct}%</span>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function WeeklyCalendar({ weekDays, items, projectNames, onAdd, onUpdate, onRemove, loading }: Props) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [modal, setModal] = useState<{ item?: WorkItem; day: number; startSlot: number } | null>(null);
  const [copiedItem, setCopiedItem] = useState<WorkItem | null>(null);
  const gridBodyRef = useRef<HTMLDivElement>(null);
  const dayColRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Computed once per render; refreshed automatically on resize (via setResizeTick)
  const slotH = getCSSSlotH();
  const gridH = slotH * TOTAL_SLOTS + BREAK_HEIGHT;

  const getTargetDay = useCallback((clientX: number): number => {
    for (let i = 0; i < 5; i++) {
      const col = dayColRefs.current[i];
      if (!col) continue;
      const rect = col.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right) return i;
    }
    return -1;
  }, []);

  const getRelativeY = useCallback((clientY: number): number => {
    if (!gridBodyRef.current) return 0;
    const rect = gridBodyRef.current.getBoundingClientRect();
    // Must add scrollTop: rect.top is the viewport edge of the scroll container,
    // not the content edge — without this, dragging while scrolled gives wrong slots.
    return clientY - rect.top + gridBodyRef.current.scrollTop;
  }, []);

  const handleItemPointerDown = useCallback((e: React.PointerEvent, item: WorkItem) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const sh = getCSSSlotH();
    const relY = getRelativeY(e.clientY);
    const itemTopY = slotToY(item.startSlot, sh);
    const grabOffset = Math.max(0, Math.floor((relY - itemTopY) / sh));

    setDragState({
      itemId: item.id,
      type: 'move',
      grabOffset,
      previewDay: item.day,
      previewSlot: item.startSlot,
      previewDuration: item.duration,
      originalDay: item.day,
      originalSlot: item.startSlot,
      originalDuration: item.duration,
    });
  }, [getRelativeY]);

  const handleResizePointerDown = useCallback((e: React.PointerEvent, item: WorkItem) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    setDragState({
      itemId: item.id,
      type: 'resize',
      grabOffset: item.duration,
      previewDay: item.day,
      previewSlot: item.startSlot,
      previewDuration: item.duration,
      originalDay: item.day,
      originalSlot: item.startSlot,
      originalDuration: item.duration,
    });
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState) return;
    e.preventDefault();

    const sh = getCSSSlotH();
    const relY = getRelativeY(e.clientY);

    if (dragState.type === 'move') {
      const targetSlotRaw = yToSlot(relY, sh);
      const newSlot = Math.max(0, Math.min(TOTAL_SLOTS - dragState.previewDuration, targetSlotRaw - dragState.grabOffset));
      const newDay = getTargetDay(e.clientX);
      const day = newDay >= 0 ? newDay : dragState.previewDay;
      setDragState(prev => prev ? { ...prev, previewSlot: newSlot, previewDay: day } : null);
    } else {
      const sh2 = getCSSSlotH();
      const targetSlot = yToSlot(relY, sh2);
      const newDuration = Math.max(1, Math.min(TOTAL_SLOTS - dragState.previewSlot, targetSlot - dragState.previewSlot + 1));
      setDragState(prev => prev ? { ...prev, previewDuration: newDuration } : null);
    }
  }, [dragState, getRelativeY, getTargetDay]);

  const handlePointerUp = useCallback(() => {
    if (!dragState) return;
    const { itemId, type, previewDay, previewSlot, previewDuration } = dragState;
    if (type === 'move') {
      onUpdate(itemId, { day: previewDay, startSlot: previewSlot });
    } else {
      onUpdate(itemId, { duration: previewDuration });
    }
    setDragState(null);
  }, [dragState, onUpdate]);

  const handleGridClick = useCallback((e: React.MouseEvent, day: number) => {
    if (dragState) return;
    const col = dayColRefs.current[day];
    if (!col) return;
    const rect = col.getBoundingClientRect();
    const relY = e.clientY - rect.top;
    const slot = yToSlot(relY, getCSSSlotH());

    if (copiedItem) {
      const safeSlot = Math.min(slot, TOTAL_SLOTS - copiedItem.duration);
      onAdd({ ...copiedItem, id: crypto.randomUUID(), day, startSlot: safeSlot, completed: false });
      return;
    }

    setModal({ day, startSlot: slot });
  }, [dragState, copiedItem, onAdd]);

  const handleModalSave = useCallback((data: Omit<WorkItem, 'id'> & { id?: string }) => {
    if (data.id) {
      onUpdate(data.id, data);
    } else {
      onAdd({ ...data, id: crypto.randomUUID(), completed: false });
    }
    setModal(null);
  }, [onAdd, onUpdate]);

  const handleItemClick = useCallback((item: WorkItem) => {
    setModal(item);
  }, []);

  const handleToggleComplete = useCallback((itemId: string, current: boolean) => {
    onUpdate(itemId, { completed: !current });
  }, [onUpdate]);

  const handleCopy = useCallback((item: WorkItem) => {
    setCopiedItem(prev => prev?.id === item.id ? null : item);
  }, []);

  useEffect(() => {
    if (!copiedItem) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setCopiedItem(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [copiedItem]);

  if (loading) {
    return (
      <div className="calendar-loading">
        <div className="spinner" />
        <span>載入中...</span>
      </div>
    );
  }

  const previewItem = dragState ? items.find(i => i.id === dragState.itemId) : null;
  const workTitles = [...new Set(items.map(i => i.title).filter(Boolean))];

  return (
    <>
    <ProgressBar items={items} />
    {copiedItem && (
      <div className="copy-mode-banner">
        <span>複製模式：點擊任意時間格貼上「{copiedItem.title}」</span>
        <button className="copy-cancel-btn" onClick={() => setCopiedItem(null)}>✕ 取消複製</button>
      </div>
    )}
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

      <div
        className="calendar-body"
        ref={gridBodyRef}
        onPointerMove={dragState ? handlePointerMove : undefined}
        onPointerUp={dragState ? handlePointerUp : undefined}
        onPointerCancel={() => setDragState(null)}
        style={{
          cursor: dragState
            ? (dragState.type === 'move' ? 'grabbing' : 'ns-resize')
            : copiedItem ? 'copy' : 'default',
          ['--grid-h' as string]: `${gridH}px`,
        }}
      >
        {/* Time gutter */}
        <div className="time-gutter">
          {TIME_LABELS.map((label, i) => (
            <div
              key={label}
              className="time-label"
              style={{ top: slotToY(i, slotH) }}
            >
              {label}
            </div>
          ))}
          <div className="break-label" style={{ top: MORNING_SLOTS * slotH }}>午休</div>
        </div>

        {/* Day columns */}
        {weekDays.map((_, dayIdx) => {
          const dayItems = items.filter(i => i.day === dayIdx);

          return (
            <div
              key={dayIdx}
              className="day-column"
              ref={el => { dayColRefs.current[dayIdx] = el; }}
              style={{ height: gridH }}
              onClick={e => handleGridClick(e, dayIdx)}
            >
              {/* Slot grid lines */}
              {Array.from({ length: TOTAL_SLOTS }, (_, s) => (
                <div
                  key={s}
                  className={`slot-line${s === MORNING_SLOTS ? ' after-morning' : ''}`}
                  style={{ top: slotToY(s, slotH) + (s === MORNING_SLOTS ? BREAK_HEIGHT : 0) }}
                />
              ))}

              {/* Break separator */}
              <div className="break-sep" style={{ top: MORNING_SLOTS * slotH }} />

              {/* Work items */}
              {dayItems.map(item => {
                const isThisDragging = dragState?.itemId === item.id;
                const displayItem = isThisDragging && dragState
                  ? {
                    ...item,
                    day: dragState.type === 'move' ? dragState.previewDay : item.day,
                    startSlot: dragState.type === 'move' ? dragState.previewSlot : item.startSlot,
                    duration: dragState.type === 'resize' ? dragState.previewDuration : item.duration,
                  }
                  : item;

                if (displayItem.day !== dayIdx) return null;

                return (
                  <WorkItemCard
                    key={item.id}
                    item={displayItem}
                    isDragging={isThisDragging && !!dragState}
                    isCopied={copiedItem?.id === item.id}
                    onPointerDown={e => handleItemPointerDown(e, item)}
                    onResizePointerDown={e => handleResizePointerDown(e, item)}
                    onClick={() => { if (!copiedItem) handleItemClick(item); }}
                    onToggleComplete={() => handleToggleComplete(item.id, item.completed)}
                    onCopy={() => handleCopy(item)}
                  />
                );
              })}

              {/* Ghost during cross-day drag */}
              {dragState?.type === 'move' &&
                dragState.previewDay === dayIdx &&
                previewItem &&
                dragState.originalDay !== dayIdx && (
                  <WorkItemCard
                    key="ghost"
                    item={{ ...previewItem, day: dayIdx, startSlot: dragState.previewSlot }}
                    isDragging
                    isPreview
                    onPointerDown={() => {}}
                    onResizePointerDown={() => {}}
                    onClick={() => {}}
                    onToggleComplete={() => {}}
                    onCopy={() => {}}
                  />
                )}
            </div>
          );
        })}
      </div>

      {modal && (
        <WorkItemModal
          item={modal}
          projectNames={projectNames}
          workTitles={workTitles}
          onSave={handleModalSave}
          onDelete={'id' in modal && modal.id ? () => { onRemove((modal as WorkItem).id); setModal(null); } : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
    </>
  );
}
