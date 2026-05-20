import { useState } from 'react';
import type { Department } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { appendEmployee } from '../services/sheetsService';

const DEPARTMENTS: Department[] = ['企劃部', '設計部', '管理部'];

export function ProfileSetup() {
  const { user, systemIds, refreshSystemData, logout } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [department, setDepartment] = useState<Department>('企劃部');
  const [startDate, setStartDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !user || !systemIds) return;

    setSaving(true);
    setError('');
    try {
      await appendEmployee(systemIds.systemSheetId, {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: user.email,
        department,
        startDate,
      });
      // Reload employees — once user.employee is set App will route to CalendarPage
      await refreshSystemData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存失敗，請重試');
      setSaving(false);
    }
  };

  return (
    <div className="profile-setup-page">
      <div className="profile-setup-card">
        {/* Avatar + welcome */}
        <div className="ps-welcome">
          {user?.picture
            ? <img src={user.picture} alt={user.name} className="ps-avatar" />
            : <div className="ps-avatar-placeholder">{(user?.name ?? '?')[0]}</div>
          }
          <div>
            <h2>歡迎，{user?.name}！</h2>
            <p>請填寫個人資料，完成後可立即使用週工作報表系統。<br />資料儲存在公司 Google Sheets，之後登入自動帶入，無需再次填寫。</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="ps-form">
          {/* Gmail — read-only */}
          <div className="form-group">
            <label>Gmail（登入帳號）</label>
            <input className="form-input ps-readonly" value={user?.email ?? ''} readOnly tabIndex={-1} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>姓名 *</label>
              <input
                className="form-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="請輸入真實姓名"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>部門 *</label>
              <select
                className="form-input"
                value={department}
                onChange={e => setDepartment(e.target.value as Department)}
              >
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>到職日期 *</label>
            <input
              className="form-input"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="ps-actions">
            <button type="button" className="btn-secondary" onClick={logout} disabled={saving}>
              登出
            </button>
            <button type="submit" className="btn-primary ps-submit" disabled={saving || !name.trim() || !startDate}>
              {saving
                ? <><span className="spinner-sm" /> 儲存中…</>
                : '儲存並開始使用 →'
              }
            </button>
          </div>
        </form>

        <p className="ps-note">
          ✦ 此資料由主管管理，如需更改請聯絡主管
        </p>
      </div>
    </div>
  );
}
