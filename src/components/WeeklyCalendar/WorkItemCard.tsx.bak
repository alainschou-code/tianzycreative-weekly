import type { WorkItem } from '../../types';
import { MORNING_SLOTS, formatDuration } from '../../utils/timeUtils';

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

export function WorkItemCard({
  item, isDragging, isPreview, isCopied,
  onPointerDown, onResizePointerDown, onClick, onToggleComplete, onCopy,
}: Props) {
  const slotH = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--slot-h'),
  ) || 40;
  const estHeight = item.duration * slotH - 4;
  const titleLines = Math.max(1, Math.floor((estHeight - 22) / 15));
  const showProject = !!item.projectName && item.projectName !== item.title && estHeight >= 52;
  const showDuration = estHeight >= 28;

  return (
    <div
      className={`work-item${isDragging ? ' dragging' : ''}${isPreview ? ' preview' : ''}${item.completed ? ' completed' : ''}${isCopied ? ' copied' : ''}`}
      style={{
        '--item-start': item.startSlot,
        '--item-dur': item.duration,
        '--pm-offset-px': item.startSlot >= MORNING_SLOTS ? '36px' : '0px',
        backgroundColor: item.color,
        touchAction: 'none',
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

      {/* Copy button — visible on hover, highlighted when this item is the copy source */}
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
