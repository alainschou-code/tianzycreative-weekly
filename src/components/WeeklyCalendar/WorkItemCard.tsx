import type { WorkItem } from '../../types';
import { MORNING_SLOTS, BREAK_HEIGHT, TOTAL_SLOTS, formatDuration } from '../../utils/timeUtils';

interface Props {
  item: WorkItem;
  isDragging: boolean;
  isPreview?: boolean;
  isCopied?: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onResizePointerDown: (e: React.PointerEvent) => void;
  onClick: () => void;
  onToggleComplete: () => void;
  onCopy: () => void;
}

// 計算卡片的 top（px），正確處理午休偏移
function itemTop(startSlot: number, slotH: number): number {
  if (startSlot < MORNING_SLOTS) {
    return startSlot * slotH + 2;
  }
  return MORNING_SLOTS * slotH + BREAK_HEIGHT + (startSlot - MORNING_SLOTS) * slotH + 2;
}

// 計算卡片的 height（px），正確處理跨越午休的情況
function itemHeight(startSlot: number, duration: number, slotH: number): number {
  const endSlot = Math.min(startSlot + duration, TOTAL_SLOTS);
  const startY = itemTop(startSlot, slotH) - 2; // 去掉 +2 偏移
  const endSlotIsPM = endSlot > MORNING_SLOTS;
  const startSlotIsPM = startSlot >= MORNING_SLOTS;

  let endY: number;
  if (endSlotIsPM) {
    endY = MORNING_SLOTS * slotH + BREAK_HEIGHT + (endSlot - MORNING_SLOTS) * slotH;
  } else {
    endY = endSlot * slotH;
  }

  // 跨越午休：需加上 BREAK_HEIGHT
  const crossesBreak = startSlot < MORNING_SLOTS && endSlot > MORNING_SLOTS;
  if (crossesBreak) {
    return endY - startY - 4;
  }

  return endY - startY - 4;
}

export function WorkItemCard({
  item, isDragging, isPreview, isCopied,
  onPointerDown, onResizePointerDown, onClick, onToggleComplete, onCopy,
}: Props) {
  const slotH = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--slot-h'),
  ) || 40;

  const top = itemTop(item.startSlot, slotH);
  const height = itemHeight(item.startSlot, item.duration, slotH);

  const showProject = !!item.projectName && item.projectName !== item.title && height >= 52;
  const showDuration = height >= 28;
  const titleLines = Math.max(1, Math.floor((height - 22) / 15));

  return (
    <div
      className={`work-item${isDragging ? ' dragging' : ''}${isPreview ? ' preview' : ''}${item.completed ? ' completed' : ''}${isCopied ? ' copied' : ''}`}
      style={{
        position: 'absolute',
        left: 3,
        right: 3,
        top: top,
        height: height,
        backgroundColor: item.color,
        touchAction: 'none',
        borderRadius: 6,
        padding: '6px 7px 16px 30px',
        cursor: 'grab',
        color: '#fff',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        zIndex: 10,
        userSelect: 'none',
      } as React.CSSProperties}
      onPointerDown={onPointerDown}
      onClick={isDragging ? undefined : (e) => { e.stopPropagation(); onClick(); }}
      title={[item.title, item.projectName, item.content].filter(Boolean).join('\n')}
    >
      <button
        className={`item-check${item.completed ? ' checked' : ''}`}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onToggleComplete(); }}
        title={item.completed ? '取消完成' : '標記為完成'}
        aria-label={item.completed ? '取消完成' : '標記為完成'}
      >
        {item.completed && (
          <svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="2,6 5,9 10,3" />
          </svg>
        )}
      </button>

      <button
        className={`item-copy${isCopied ? ' active' : ''}`}
        onPointerDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onCopy(); }}
        title={isCopied ? '取消複製' : '複製此工作項目'}
        aria-label={isCopied ? '取消複製' : '複製'}
      >
        <svg viewBox="0 0 12 12" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="1" width="7" height="8" rx="1.5" />
          <path d="M1 4h2M1 4V11h6v-2" />
        </svg>
      </button>

      <div
        className="work-item-title"
        style={titleLines === 1
          ? { display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
          : { display: '-webkit-box', WebkitLineClamp: titleLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
        }
      >
        {item.title}
      </div>

      {showProject && (
        <div className="work-item-project">{item.projectName}</div>
      )}

      {showDuration && (
        <div className="work-item-duration">{formatDuration(item.duration)}</div>
      )}

      <div
        className="resize-handle"
        onPointerDown={e => { e.stopPropagation(); onResizePointerDown(e); }}
      />
    </div>
  );
}
