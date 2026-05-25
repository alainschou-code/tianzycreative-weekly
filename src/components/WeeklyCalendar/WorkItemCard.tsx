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

function itemTop(startSlot: number, slotH: number): number {
  if (startSlot < MORNING_SLOTS) return startSlot * slotH + 2;
  return MORNING_SLOTS * slotH + BREAK_HEIGHT + (startSlot - MORNING_SLOTS) * slotH + 2;
}

function itemHeight(startSlot: number, duration: number, slotH: number): number {
  const endSlot = Math.min(startSlot + duration, TOTAL_SLOTS);
  let endY: number;
  if (endSlot > MORNING_SLOTS) {
    endY = MORNING_SLOTS * slotH + BREAK_HEIGHT + (endSlot - MORNING_SLOTS) * slotH;
  } else {
    endY = endSlot * slotH;
  }
  const startY = itemTop(startSlot, slotH) - 2;
  return endY - startY - 4;
}

export function WorkItemCard({
  item, isDragging, isPreview, isCopied,
  onPointerDown, onResizePointerDown, onClick, onToggleComplete, onCopy,
}: Props) {
  const slotH = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--slot-h'),
  ) || 56;

  const top = itemTop(item.startSlot, slotH);
  const height = itemHeight(item.startSlot, item.duration, slotH);
  const showProject = !!item.projectName && item.projectName !== item.title && height >= 52;
  const showDuration = height >= 28;

  const classNames = [
    'work-item',
    isDragging ? 'dragging' : '',
    isPreview ? 'preview' : '',
    item.completed ? 'completed' : '',
    isCopied ? 'copied' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      style={{
        position: 'absolute',
        left: 3,
        right: 3,
        top,
        height,
        backgroundColor: item.color,
        touchAction: 'none',
        borderRadius: 6,
        padding: '6px 7px 16px 32px',
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
      {/* 勾選圈 */}
      <button
        className={`item-check${item.completed ? ' checked' : ''}`}
        style={{ position: 'absolute', top: 6, left: 7, width: 16, height: 16 }}
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

      {/* 複製按鈕 */}
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

      {/* 標題 */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          lineHeight: 1.4,
          wordBreak: 'break-word',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: Math.max(1, Math.floor((height - 24) / 20)),
          WebkitBoxOrient: 'vertical',
        }}
      >
        {item.title}
      </div>

      {/* 建案名稱 */}
      {showProject && (
        <div style={{
          fontSize: 12,
          opacity: 0.85,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          marginTop: 2,
        }}>
          {item.projectName}
        </div>
      )}

      {/* 時長 */}
      {showDuration && (
        <div style={{
          position: 'absolute',
          bottom: 3,
          right: 6,
          fontSize: 11,
          opacity: 0.85,
          whiteSpace: 'nowrap',
        }}>
          {formatDuration(item.duration)}
        </div>
      )}

      {/* 拖曳把手 */}
      <div
        className="resize-handle"
        onPointerDown={e => { e.stopPropagation(); onResizePointerDown(e); }}
      />
    </div>
  );
}
