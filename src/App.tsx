import { useState, useRef, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { ProfileSetup } from './components/ProfileSetup';
import { Header } from './components/Header';
import { WeeklyCalendar } from './components/WeeklyCalendar';
import { AdminPanel } from './components/Admin/AdminPanel';
import { useCurrentWeek } from './hooks/useCurrentWeek';
import { useProjectNames } from './hooks/useProjectNames';
import { useWorkItems } from './hooks/useWorkItems';
import { formatWeekLabel, formatSeniority } from './utils/dateUtils';

function CalendarPage() {
  const { user, systemIds } = useAuth();
  const [showAdmin, setShowAdmin] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { weekStart, weekDays, weekKey, goNext, goPrev, goToday } = useCurrentWeek();
  const { projectNames } = useProjectNames();
  const captureRef = useRef<HTMLDivElement>(null);

  const employee = user?.employee;
  const { items, loading, saving, isDirty, addItem, updateItem, removeItem, saveNow } = useWorkItems({
    employeeName: employee?.name ?? user?.name ?? '',
    employeeEmail: user?.email ?? '',
    weekStart: weekKey,
    workFolderId: systemIds?.workFolderId ?? '',
  });

  const handleExport = useCallback(async () => {
    if (!captureRef.current) return;
    setExporting(true);

    // Brief delay so exporting state renders
    await new Promise(r => setTimeout(r, 80));

    const offscreen = document.createElement('div');

    try {
      const { default: html2canvas } = await import('html2canvas');

      // Compute grid height from CSS variable
      const slotH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--slot-h')) || 56;
      const gridH = slotH * 16 + 36; // TOTAL_SLOTS * slotH + BREAK_HEIGHT

      // Off-screen container: fixed 1440px width, 24px padding, auto height
      Object.assign(offscreen.style, {
        position: 'fixed',
        left: '-10000px',
        top: '0',
        width: '1440px',
        background: '#f5f6f8',
        padding: '24px',
        boxSizing: 'border-box',
        overflow: 'visible',
      });

      // Deep-clone the capture area
      const clone = captureRef.current.cloneNode(true) as HTMLElement;
      Object.assign(clone.style, {
        display: 'block',
        flex: 'none',
        overflow: 'visible',
        height: 'auto',
        maxHeight: 'none',
        width: '100%',
      });

      // Show export banner
      const exportMeta = clone.querySelector('.export-meta') as HTMLElement | null;
      if (exportMeta) exportMeta.style.display = 'flex';

      // Unconstrain calendar body so full grid is visible
      const calBody = clone.querySelector('.calendar-body') as HTMLElement | null;
      if (calBody) {
        Object.assign(calBody.style, {
          overflow: 'visible',
          height: 'auto',
          maxHeight: 'none',
          paddingBottom: '80px',
        });
      }

      // Give explicit heights so absolute-positioned children are contained
      const timeGutter = clone.querySelector('.calendar-body .time-gutter') as HTMLElement | null;
      if (timeGutter) timeGutter.style.height = `${gridH}px`;
      clone.querySelectorAll('.day-column').forEach(col => {
        (col as HTMLElement).style.height = `${gridH}px`;
      });

      // Remove overflow from remaining ancestors inside clone
      const calWrap = clone.querySelector('.calendar-wrap') as HTMLElement | null;
      if (calWrap) Object.assign(calWrap.style, { overflow: 'visible', height: 'auto', flex: 'none' });

      offscreen.appendChild(clone);
      document.body.appendChild(offscreen);

      // Two frames for layout reflow
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

      const totalW = offscreen.scrollWidth;
      const totalH = offscreen.scrollHeight;

      const canvas = await html2canvas(offscreen, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f5f6f8',
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        width: totalW,
        height: totalH,
        windowWidth: totalW,
        windowHeight: totalH,
        logging: false,
        imageTimeout: 8000,
      });

      const link = document.createElement('a');
      link.download = `${employee?.name ?? user?.name ?? '員工'}_週報_${weekKey}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    } catch (err) {
      console.error('Export failed', err);
      alert('截圖失敗，請重試');
    } finally {
      if (offscreen.parentNode) document.body.removeChild(offscreen);
      setExporting(false);
    }
  }, [employee, user, weekKey]);

  if (showAdmin && user?.isSupervisor) {
    return <AdminPanel onBack={() => setShowAdmin(false)} />;
  }

  return (
    <div className="app-layout">
      <Header
        weekStart={weekStart}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onSave={saveNow}
        saving={saving}
        isDirty={isDirty}
        showAdmin={user?.isSupervisor}
        onAdminClick={() => setShowAdmin(true)}
        onExport={handleExport}
        exporting={exporting}
      />
      <main className="app-main">
        {/* capture-area wraps everything that appears in the screenshot */}
        <div ref={captureRef} className="capture-area">
          {/* Banner shown only during export */}
          <div className="export-meta" aria-hidden="true">
            <span className="em-brand">天子創意</span>
            <span className="em-name">{employee?.name ?? user?.name}</span>
            {employee?.department && <span className="emp-dept">{employee.department}</span>}
            <span className="em-week">{formatWeekLabel(weekStart)}</span>
          </div>

          {employee && (
            <div className="employee-info-bar">
              <span className="emp-name">{employee.name}</span>
              <span className="emp-dept">{employee.department}</span>
              <span className="emp-seniority">年資 {formatSeniority(employee.startDate)}</span>
            </div>
          )}
          <WeeklyCalendar
            weekDays={weekDays}
            items={items}
            projectNames={projectNames}
            onAdd={addItem}
            onUpdate={updateItem}
            onRemove={removeItem}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <span>初始化系統中...</span>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  // First-time user (or supervisor without profile): show profile setup
  if (!user.employee) return <ProfileSetup />;

  return <CalendarPage />;
}
