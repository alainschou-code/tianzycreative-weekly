import { useAuth } from '../contexts/AuthContext';
import { formatWeekLabel } from '../utils/dateUtils';

interface Props {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSave: () => void;
  saving: boolean;
  isDirty: boolean;
  onAdminClick?: () => void;
  showAdmin?: boolean;
  onExport?: () => void;
  exporting?: boolean;
}

export function Header({ weekStart, onPrev, onNext, onToday, onSave, saving, isDirty, onAdminClick, showAdmin, onExport, exporting }: Props) {
  const { user, logout } = useAuth();

  return (
    <header className="app-header">
      <div className="header-left">
        <span className="header-brand">天子創意</span>
        <span className="header-title">週工作報表</span>
      </div>

      <div className="header-center">
        <button className="nav-btn" onClick={onPrev} title="上週">&#8249;</button>
        <button className="nav-today" onClick={onToday}>本週</button>
        <span className="week-label">{formatWeekLabel(weekStart)}</span>
        <button className="nav-btn" onClick={onNext} title="下週">&#8250;</button>
      </div>

      <div className="header-right">
        {isDirty && (
          <button className="btn-save" onClick={onSave} disabled={saving}>
            {saving ? '儲存中…' : '儲存'}
          </button>
        )}
        {saving && !isDirty && <span className="save-status">已儲存 ✓</span>}
        {onExport && (
          <button className="btn-export" onClick={onExport} disabled={exporting} title="匯出週報截圖 (PNG)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {exporting ? '截圖中…' : '匯出截圖'}
          </button>
        )}
        {showAdmin && (
          <button className="btn-admin" onClick={onAdminClick}>後台管理</button>
        )}
        <div className="user-badge">
          {user?.picture && <img src={user.picture} alt={user.name} className="user-avatar" />}
          <span className="user-name">{user?.name}</span>
          <button className="btn-logout" onClick={logout}>登出</button>
        </div>
      </div>
    </header>
  );
}
