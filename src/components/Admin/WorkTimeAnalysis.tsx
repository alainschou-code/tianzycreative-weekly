import type { WorkItem } from '../../types';
import { formatDuration } from '../../utils/timeUtils';

interface Props {
  items: WorkItem[];
  employeeName: string;
  allReports?: { employeeName: string; items: WorkItem[] }[];
}

interface ItemStat {
  title: string;
  projectName: string;
  count: number;
  totalSlots: number;
}

function aggregate(items: WorkItem[]): ItemStat[] {
  const map = new Map<string, ItemStat>();
  for (const item of items) {
    const existing = map.get(item.title);
    if (existing) {
      existing.count++;
      existing.totalSlots += item.duration;
    } else {
      map.set(item.title, {
        title: item.title,
        projectName: item.projectName,
        count: 1,
        totalSlots: item.duration,
      });
    }
  }
  return [...map.values()].sort((a, b) => b.totalSlots - a.totalSlots);
}

export function WorkTimeAnalysis({ items, employeeName, allReports }: Props) {
  if (items.length === 0) return null;

  const stats = aggregate(items);

  // Cross-employee comparison: same title across all reports for this week
  const crossMap = new Map<string, { employee: string; count: number; totalSlots: number }[]>();
  if (allReports && allReports.length > 1) {
    for (const r of allReports) {
      const rStats = aggregate(r.items);
      for (const s of rStats) {
        const list = crossMap.get(s.title) ?? [];
        list.push({ employee: r.employeeName, count: s.count, totalSlots: s.totalSlots });
        crossMap.set(s.title, list);
      }
    }
  }

  // Only show cross-employee titles that appear in >1 employee
  const crossTitles = [...crossMap.entries()]
    .filter(([, rows]) => rows.length > 1)
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="work-analysis">
      <h4>工時分析 — {employeeName}</h4>
      <table className="data-table">
        <thead>
          <tr>
            <th>工作項目</th>
            <th>建案</th>
            <th>執行次數</th>
            <th>總時數</th>
          </tr>
        </thead>
        <tbody>
          {stats.map(s => (
            <tr key={s.title}>
              <td>{s.title}</td>
              <td>{s.projectName || '—'}</td>
              <td>{s.count} 次</td>
              <td>{formatDuration(s.totalSlots)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {crossTitles.length > 0 && (
        <>
          <h4 style={{ marginTop: 20 }}>跨員工相同項目比較</h4>
          <table className="data-table">
            <thead>
              <tr>
                <th>工作項目</th>
                <th>員工</th>
                <th>執行次數</th>
                <th>總時數</th>
              </tr>
            </thead>
            <tbody>
              {crossTitles.map(([title, rows]) =>
                rows.map((row, i) => (
                  <tr key={`${title}-${row.employee}`}>
                    {i === 0 && (
                      <td rowSpan={rows.length} style={{ fontWeight: 500 }}>{title}</td>
                    )}
                    <td>{row.employee}</td>
                    <td>{row.count} 次</td>
                    <td>{formatDuration(row.totalSlots)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
