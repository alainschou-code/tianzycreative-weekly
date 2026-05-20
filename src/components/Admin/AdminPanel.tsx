import { useState, useEffect, useCallback } from 'react';
import type { Employee, Supervisor } from '../../types';
import { loadEmployees, loadSupervisors, saveEmployees, saveSupervisors } from '../../services/sheetsService';
import { EmployeeManagement } from './EmployeeManagement';
import { SupervisorManagement } from './SupervisorManagement';
import { ReportViewer } from './ReportViewer';
import { AiAssistant } from './AiAssistant';
import { useAuth } from '../../contexts/AuthContext';

type Tab = 'employees' | 'reports' | 'supervisors' | 'ai';

interface Props {
  onBack: () => void;
}

export function AdminPanel({ onBack }: Props) {
  const { systemIds, refreshSystemData } = useAuth();
  const [tab, setTab] = useState<Tab>('employees');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => {
    setReloadKey(k => k + 1);
    setLoadError(null);
  }, []);

  useEffect(() => {
    if (!systemIds) return;
    setLoading(true);
    setLoadError(null);
    Promise.all([
      loadEmployees(systemIds.systemSheetId),
      loadSupervisors(systemIds.systemSheetId),
    ])
      .then(([emps, sups]) => {
        setEmployees(emps);
        setSupervisors(sups);
      })
      .catch(err => {
        setLoadError(err instanceof Error ? err.message : '載入資料失敗，請重試');
      })
      .finally(() => setLoading(false));
  }, [systemIds, reloadKey]);

  const handleEmployeesChange = async (next: Employee[]) => {
    if (!systemIds) return;
    setEmployees(next);
    setSaving(true);
    try {
      await saveEmployees(systemIds.systemSheetId, next);
      await refreshSystemData();
    } catch (err) {
      alert(`儲存失敗：${err instanceof Error ? err.message : '請重試'}`);
      // Revert on error
      reload();
    } finally {
      setSaving(false);
    }
  };

  const handleSupervisorsChange = async (next: Supervisor[]) => {
    if (!systemIds) return;
    setSupervisors(next);
    setSaving(true);
    try {
      await saveSupervisors(systemIds.systemSheetId, next);
      await refreshSystemData();
    } catch (err) {
      alert(`儲存失敗：${err instanceof Error ? err.message : '請重試'}`);
      reload();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="admin-topbar">
          <button className="btn-back" onClick={onBack}>← 返回報表</button>
          <h2>後台管理</h2>
        </div>
        <div className="loading-page" style={{ flex: 1 }}>
          <div className="spinner" />
          <span>載入後台資料...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="admin-panel">
        <div className="admin-topbar">
          <button className="btn-back" onClick={onBack}>← 返回報表</button>
          <h2>後台管理</h2>
        </div>
        <div className="loading-page" style={{ flex: 1 }}>
          <div className="error-box">
            <h3>載入失敗</h3>
            <p>{loadError}</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn-primary" onClick={reload}>重新載入</button>
              <button className="btn-secondary" onClick={onBack}>返回</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const TABS: [Tab, string, string][] = [
    ['employees',  '員工管理',  `${employees.length} 人`],
    ['reports',    '週報查閱',  ''],
    ['supervisors','主管帳號',  `${supervisors.length} 人`],
    ['ai',         'AI 助理',   ''],
  ];

  return (
    <div className="admin-panel">
      <div className="admin-topbar">
        <button className="btn-back" onClick={onBack}>← 返回報表</button>
        <h2>後台管理</h2>
        {saving && <span className="save-status">儲存中...</span>}
      </div>

      <div className="admin-tabs">
        {TABS.map(([t, label, badge]) => (
          <button
            key={t}
            className={`admin-tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {label}
            {badge && <span className="tab-badge">{badge}</span>}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {tab === 'employees' && (
          <EmployeeManagement
            employees={employees}
            onChange={handleEmployeesChange}
            saving={saving}
          />
        )}
        {tab === 'reports' && systemIds && (
          <ReportViewer employees={employees} workFolderId={systemIds.workFolderId} />
        )}
        {tab === 'supervisors' && (
          <SupervisorManagement
            supervisors={supervisors}
            onChange={handleSupervisorsChange}
            saving={saving}
          />
        )}
        {tab === 'ai' && systemIds && (
          <AiAssistant workFolderId={systemIds.workFolderId} />
        )}
      </div>
    </div>
  );
}
