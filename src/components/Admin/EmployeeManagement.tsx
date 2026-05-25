import { useState } from 'react';
import type { Employee, Department } from '../../types';
import { formatSeniority } from '../../utils/dateUtils';

const DEPARTMENTS: Department[] = ['企劃部', '設計部', '管理部'];

interface Props {
  employees: Employee[];
  onChange: (employees: Employee[]) => void;
  saving: boolean;
}

const EMPTY: Omit<Employee, 'id'> = { name: '', email: '', department: '企劃部', startDate: '' };

export function EmployeeManagement({ employees, onChange, saving }: Props) {
  const [form, setForm] = useState<Omit<Employee, 'id'>>(EMPTY);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.startDate) {
      setError('請填寫所有必填欄位');
      return;
    }
    const emailLower = form.email.toLowerCase();
    const duplicate = employees.some(emp =>
      emp.email.toLowerCase() === emailLower && emp.id !== editId,
    );
    if (duplicate) { setError('此 Gmail 已存在'); return; }

    if (editId) {
      onChange(employees.map(e => e.id === editId ? { ...form, id: editId } : e));
      setEditId(null);
    } else {
      onChange([...employees, { ...form, id: crypto.randomUUID() }]);
    }
    setForm(EMPTY);
  };

  const startEdit = (emp: Employee) => {
    setEditId(emp.id);
    setForm({ name: emp.name, email: emp.email, department: emp.department, startDate: emp.startDate });
    setError('');
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(EMPTY);
    setError('');
  };

  const remove = (id: string) => {
    if (!confirm('確定刪除此員工？')) return;
    onChange(employees.filter(e => e.id !== id));
  };

  const displayed = employees.filter(emp =>
    !search || emp.name.includes(search) || emp.email.includes(search)
  );

  return (
    <div className="admin-section">
      <h3>員工資料管理</h3>

      <form className="admin-form" onSubmit={submit}>
        <div className="form-row">
          <div className="form-group">
            <label>姓名 *</label>
            <input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="員工姓名" />
          </div>
          <div className="form-group">
            <label>Gmail *</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="xxx@gmail.com" />
          </div>
          <div className="form-group">
            <label>部門 *</label>
            <select className="form-input" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value as Department }))}>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>到職日期 *</label>
            <input className="form-input" type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
          </div>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          {editId && <button type="button" className="btn-secondary" onClick={cancelEdit}>取消</button>}
          <button type="submit" className="btn-primary" disabled={saving}>
            {editId ? '更新員工' : '新增員工'}
          </button>
        </div>
      </form>

      <input
        className="form-input"
        style={{ marginBottom: 12, maxWidth: 320 }}
        placeholder="搜尋員工姓名或 Gmail..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <table className="data-table">
        <thead>
          <tr>
            <th>姓名</th>
            <th>Gmail</th>
            <th>部門</th>
            <th>到職日期</th>
            <th>年資</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {displayed.length === 0 ? (
            <tr><td colSpan={6} className="empty-row">尚無員工資料</td></tr>
          ) : displayed.map(emp => (
            <tr key={emp.id}>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td><span className="dept-badge">{emp.department}</span></td>
              <td>{emp.startDate}</td>
              <td>{formatSeniority(emp.startDate)}</td>
              <td>
                <button className="btn-sm" onClick={() => startEdit(emp)}>編輯</button>
                <button className="btn-sm btn-sm-danger" onClick={() => remove(emp.id)}>刪除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
