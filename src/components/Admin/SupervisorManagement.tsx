import { useState } from 'react';
import type { Supervisor } from '../../types';

const DEFAULT_SUPERVISOR = import.meta.env.VITE_DEFAULT_SUPERVISOR as string;

interface Props {
  supervisors: Supervisor[];
  onChange: (supervisors: Supervisor[]) => void;
  saving: boolean;
}

export function SupervisorManagement({ supervisors, onChange, saving }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !name.trim()) { setError('請填寫 Gmail 和姓名'); return; }
    if (supervisors.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      setError('此帳號已是主管');
      return;
    }
    onChange([...supervisors, { email: email.trim(), name: name.trim(), addedAt: new Date().toISOString() }]);
    setEmail('');
    setName('');
  };

  const remove = (em: string) => {
    if (em.toLowerCase() === DEFAULT_SUPERVISOR.toLowerCase()) {
      alert('無法移除預設主管帳號');
      return;
    }
    onChange(supervisors.filter(s => s.email.toLowerCase() !== em.toLowerCase()));
  };

  return (
    <div className="admin-section">
      <h3>主管帳號管理</h3>

      <form className="admin-form" onSubmit={add}>
        <div className="form-row">
          <div className="form-group">
            <label>Gmail *</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="supervisor@gmail.com" />
          </div>
          <div className="form-group">
            <label>姓名 *</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="主管姓名" />
          </div>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>新增主管</button>
        </div>
      </form>

      <table className="data-table">
        <thead>
          <tr>
            <th>姓名</th>
            <th>Gmail</th>
            <th>新增日期</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {supervisors.length === 0 ? (
            <tr><td colSpan={4} className="empty-row">尚無主管帳號</td></tr>
          ) : supervisors.map(s => (
            <tr key={s.email}>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{new Date(s.addedAt).toLocaleDateString('zh-TW')}</td>
              <td>
                {s.email.toLowerCase() === DEFAULT_SUPERVISOR.toLowerCase() ? (
                  <span className="badge-default">預設主管</span>
                ) : (
                  <button className="btn-sm btn-sm-danger" onClick={() => remove(s.email)}>移除</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
