import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { login, error } = useAuth();
  const [clicking, setClicking] = React.useState(false);

  const handleLogin = () => {
    setClicking(true);
    login();
    setTimeout(() => setClicking(false), 8000);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-brand">天子創意</span>
          <span className="login-subtitle">週工作報表系統</span>
        </div>
        {error && <div className="login-error">{error}</div>}
        <button className="btn-google-login" onClick={handleLogin} disabled={clicking}>
          {clicking ? <span className="spinner-sm" /> : null}
          {clicking ? '登入中...' : '使用 Google 帳號登入'}
        </button>
        <p className="login-note">僅供天子創意員工使用</p>
      </div>
    </div>
  );
}