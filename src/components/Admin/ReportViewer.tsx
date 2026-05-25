import { useState, useEffect } from 'react';
import type { Employee, WorkItem } from '../../types';
import { listAllWeeklyReports } from '../../services/driveService';
import { loadWorkItems } from '../../services/sheetsService';
import { formatWeekLabel, isoToDate, getWeekDays } from '../../utils/dateUtils';
import { WeekCalendarView } from './WeekCalendarView';
import { WorkTimeAnalysis } from './WorkTimeAnalysis';

interface Props {
  employees: Employee[];
  workFolderId: string;
}

interface ReportFile {
  id: string;
  name: string;
  employeeName: string;
  weekStart: string;
}

interface AllReportEntry {
  employeeName: string;
  items: WorkItem[];
}

export function ReportViewer({ employees, workFolderId }: Props) {
  const [reportFiles, setReportFiles] = useState<ReportFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [filter, setFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [weekReports, setWeekReports] = useState<AllReportEntry[]>([]);
  const [loadingWeek, setLoadingWeek] = useState(false);

  useEffect(() => {
    listAllWeeklyReports(workFolderId)
      .then(files => {
        const parsed: ReportFile[] = files
          .map(f => {
            const match = f.name.match(/^(.+)_週報_(\d{4}-\d{2}-\d{2})$/);
            if (!match) return null;
            return { id: f.id, name: f.name, employeeName: match[1], weekStart: match[2] };
          })
          .filter(Boolean) as ReportFile[];
        parsed.sort((a, b) => b.weekStart.localeCompare(a.weekStart) || a.employeeName.localeCompare(b.employeeName));
        setReportFiles(parsed);
      })
      .catch(() => setReportFiles([]))
      .finally(() => setLoading(false));
  }, [workFolderId]);

  const openReport = async (file: ReportFile) => {
    setSelectedFile(file.id);
    setWorkItems([]);
    setWeekReports([]);
    setLoadingItems(true);
    try {
      const items = await loadWorkItems(file.id);
      setWorkItems(items);
      const sameWeek = reportFiles.filter(r => r.weekStart === file.weekStart && r.id !== file.id);
      if (sameWeek.length > 0) {
        setLoadingWeek(true);
        const entries: AllReportEntry[] = [{ employeeName: file.employeeName, items }];
        await Promise.all(
          sameWeek.map(async r => {
            try {
              const ri = await loadWorkItems(r.id);
              entries.push({ employeeName: r.employeeName, items: ri });
            } catch {
              entries.push({ employeeName: r.employeeName, items: [] });
            }
          }),
        );
        setWeekReports(entries);
        setLoadingWeek(false);
      }
    } catch {
      setWorkItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const departments = [...new Set(employees.map(e => e.department))];
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7;
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - dayOfWeek);
  const thisWeekKey = thisWeekStart.toISOString().slice(0, 10);
  const submittedNames = new Set(
    reportFiles.filter(r => r.weekStart >= thisWeekKey).map(r => r.employeeName)
  );
  const submittedCount = employees.filter(e => submittedNames.has(e.name)).length;
  const notSubmitted = employees.filter(e => !submittedNames.has(e.name));

  const filtered = reportFiles.filter(r => {
    const emp = employees.find(e => e.name === r.employeeName);
    if (deptFilter && emp?.department !== deptFilter) return false;
    return !filter || r.employeeName.includes(filter) || r.weekStart.includes(filter);
  });

  const selectedReport = reportFiles.find(r => r.id === selectedFile);

  if (loading) return <div className="loading-inline"><div className="spinner-sm" /> 載入中...</div>;

  return (
    <div className="admin-section report-viewer">
      <h3>員工週報查閱</h3>

      <div className="report-dashboard">
        <div className="dash-card">
          <div className="dash-num">{submittedCount}/{employees.length}</div>
          <div className="dash-label">本週已繳</div>
        </div>
        <div className="dash-card dash-warn">
          <div className="dash-num">{employees.length - submittedCount}</div>
          <div className="dash-label">尚未繳交</div>
        </div>
        <div className="dash-card">
          <div className="dash-num">{employees.length > 0 ? Math.round(submittedCount / employees.length * 100) : 0}%</div>
          <div className="dash-label">完成率</div>
        </div>
        {notSubmitted.length > 0 && (
          <div className="dash-missing">未繳：{notSubmitted.map(e => e.name).join('、')}</div>
        )}
      </div>

      <div className="report-layout">
        <div className="report-list">
          <input
            className="form-input"
            placeholder="搜尋員工或日期..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          <select
            className="form-input"
            style={{ marginTop: 6 }}
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
          >
            <option value="">所有部門</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="report-file-list">
            {filtered.length === 0 ? (
              <div className="empty-row">無報表資料</div>
            ) : filtered.map(r => {
              const emp = employees.find(e => e.name === r.employeeName);
              return (
                <div
                  key={r.id}
                  className={`report-file-item${selectedFile === r.id ? ' active' : ''}`}
                  onClick={() => openReport(r)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="rfi-name">{r.employeeName}</span>
                  </div>
                  {emp && <div className="rfi-dept">{emp.department}</div>}
                  <div className="rfi-week">{formatWeekLabel(isoToDate(r.weekStart))}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="report-detail">
          {!selectedReport ? (
            <div className="report-placeholder">← 選擇左側報表查看</div>
          ) : loadingItems ? (
            <div className="loading-inline"><div className="spinner-sm" /> 載入中...</div>
          ) : (
            <>
              <div className="report-detail-header">
                <h4>{selectedReport.employeeName}</h4>
                <span>{formatWeekLabel(isoToDate(selectedReport.weekStart))}</span>
                {workItems.length === 0 && <span className="warn-badge">尚未填寫</span>}
              </div>
              <WeekCalendarView
                weekDays={getWeekDays(isoToDate(selectedReport.weekStart))}
                items={workItems}
              />
              {loadingWeek ? (
                <div className="loading-inline" style={{ marginTop: 16 }}>
                  <div className="spinner-sm" /> 載入本週全員資料中...
                </div>
              ) : (
                <WorkTimeAnalysis
                  items={workItems}
                  employeeName={selectedReport.employeeName}
                  allReports={weekReports.length > 1 ? weekReports : undefined}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
