import { useState, useRef, useEffect } from 'react';
import type { WorkItem } from '../../types';
import { ITEM_COLORS, slotToLabel, slotToEndLabel, formatDuration, TOTAL_SLOTS } from '../../utils/timeUtils';

interface Props {
  item: Partial<WorkItem> & { day: number; startSlot: number };
  projectNames: string[];
  workTitles?: string[];
  onSave: (item: Omit<WorkItem, 'id'> & { id?: string }) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function WorkItemModal({ item, projectNames, workTitles = [], onSave, onDelete, onClose }: Props) {
  const [projectName, setProjectName] = useState(item.projectName ?? '');
  const [titleContent, setTitleContent] = useState(
    item.title
      ? item.title + (item.content ? '\n' + item.content : '')
      : '',
  );
  const [color, setColor] = useState(item.color ?? ITEM_COLORS[0]);
  const [duration, setDuration] = useState(item.duration ?? 2);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false);
  const projectRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => { projectRef.current?.focus(); }, []);

  const filtered = projectNames.filter(p =>
    p.toLowerCase().includes(projectName.toLowerCase()) && projectName.length > 0,
  );

  const firstLine = titleContent.split('\n')[0];
  const filteredTitles = workTitles.filter(t =>
    t.toLowerCase().includes(firstLine.toLowerCase()) && firstLine.length > 0 && t !== firstLine,
  );

  const handleProjectChange = (v: string) => {
    setProjectName(v);
    setShowSuggestions(v.length > 0);
  };

  const handleTitleContentChange = (v: string) => {
    setTitleContent(v);
    const line = v.split('\n')[0];
    setShowTitleSuggestions(line.length > 0);
  };

  const handleTitleSelect = (title: string) => {
    const lines = titleContent.split('\n');
    lines[0] = title;
    setTitleContent(lines.join('\n'));
    setShowTitleSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = titleContent.trim().split('\n');
    const title = lines[0].trim();
    if (!title) return;
    const content = lines.slice(1).join('\n').trim();
    onSave({
      id: item.id,
      day: item.day,
      startSlot: item.startSlot,
      duration,
      title,
      projectName: projectName.trim(),
      content,
      color,
      completed: item.completed ?? false,
    });
  };

  const maxDuration = TOTAL_SLOTS - item.startSlot;

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <h3>{item.id ? '編輯工作項目' : '新增工作項目'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-time-row">
            <span className="form-time">{slotToLabel(item.startSlot)} – {slotToEndLabel(item.startSlot + duration - 1)}</span>
            <span className="form-duration-badge">{formatDuration(duration)}</span>
          </div>

          <div className="form-group autocomplete-wrap">
            <label>建案 / 案名</label>
            <input
              ref={projectRef}
              className="form-input"
              value={projectName}
              onChange={e => handleProjectChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="選擇或輸入建案名稱"
            />
            {showSuggestions && filtered.length > 0 && (
              <ul className="autocomplete-list">
                {filtered.slice(0, 8).map(p => (
                  <li key={p} onMouseDown={() => { setProjectName(p); setShowSuggestions(false); }}>{p}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group autocomplete-wrap">
            <label>工作項目名稱 / 內容 *</label>
            <textarea
              className="form-textarea"
              value={titleContent}
              onChange={e => handleTitleContentChange(e.target.value)}
              onBlur={() => setTimeout(() => setShowTitleSuggestions(false), 150)}
              placeholder={'第一行為工作名稱\n以下各行為工作細節說明...'}
              rows={4}
              required
            />
            {showTitleSuggestions && filteredTitles.length > 0 && (
              <ul className="autocomplete-list">
                {filteredTitles.slice(0, 8).map(t => (
                  <li key={t} onMouseDown={() => handleTitleSelect(t)}>{t}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>預計時間</label>
              <div className="duration-control">
                <button type="button" className="dur-btn" onClick={() => setDuration(d => Math.max(1, d - 1))}>−</button>
                <span className="dur-value">{formatDuration(duration)}</span>
                <button type="button" className="dur-btn" onClick={() => setDuration(d => Math.min(maxDuration, d + 1))}>+</button>
              </div>
            </div>

            <div className="form-group">
              <label>顏色</label>
              <div className="color-picker">
                {ITEM_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    className={`color-swatch${color === c ? ' selected' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            {onDelete && (
              <button type="button" className="btn-danger" onClick={onDelete}>刪除</button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>取消</button>
            <button type="submit" className="btn-primary">儲存</button>
          </div>
        </form>
      </div>
    </div>
  );
}
