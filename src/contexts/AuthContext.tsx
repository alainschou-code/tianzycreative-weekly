import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { setAccessToken } from '../services/googleApi';
import { findOrCreateSystemSheet, findOrCreateWorkFolder } from '../services/driveService';
import { initSystemSheet, loadEmployees, loadSupervisors } from '../services/sheetsService';
import type { AuthUser, SystemIds } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  systemIds: SystemIds | null;
  login: () => void;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
  refreshSystemData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_SUPERVISOR = import.meta.env.VITE_DEFAULT_SUPERVISOR as string;
const STORAGE_KEY = 'alains_system_ids';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [systemIds, setSystemIds] = useState<SystemIds | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initSystem = useCallback(async (token: string, email: string, name: string, picture?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      setAccessToken(token);

      // Load or create system spreadsheet and work folder
      let ids: SystemIds;
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        ids = JSON.parse(cached) as SystemIds;
      } else {
        try {
          const [systemSheetId, workFolderId] = await Promise.all([
            findOrCreateSystemSheet(),
            findOrCreateWorkFolder(),
          ]);
          ids = { systemSheetId, workFolderId };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
        } catch (e) {
          console.warn(e);
          ids = { systemSheetId: '', workFolderId: ''  };
        }
      }

      if (ids.systemSheetId) await initSystemSheet(ids.systemSheetId);
      const [employees, supervisors] = await Promise.all([
        loadEmployees(ids.systemSheetId),
        loadSupervisors(ids.systemSheetId),
      ]);

      const employee = employees.find(e => e.email.toLowerCase() === email.toLowerCase());
      const isSupervisor =
        email.toLowerCase() === DEFAULT_SUPERVISOR.toLowerCase() ||
        supervisors.some(s => s.email.toLowerCase() === email.toLowerCase());

      setSystemIds(ids);
      setUser({
        email,
        name,
        picture,
        accessToken: token,
        tokenExpiry: Date.now() + 3500_000,
        employee,
        isSupervisor,
      });
    } catch (err) {
      console.error("initSystem error:", err);
      setError(err instanceof Error ? err.message : '初始化失敗，請重試');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    scope: [
      'email profile',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ].join(' '),
    onSuccess: async (response) => {
      console.log("onSuccess triggered", response);
      // Fetch user profile with the token
      try {
        const profile = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${response.access_token}` },
        }).then(r => r.json()) as { email: string; name: string; picture?: string };
        await initSystem(response.access_token, profile.email, profile.name, profile.picture);
      } catch {
        console.error("onSuccess catch error");
        setError('無法取得使用者資料，請重試');
        setIsLoading(false);
      }
    },
    onError: (err) => {
      console.error('onError:', err);
      setError('Google 登入失敗，請重試');
      setIsLoading(false);
    },
  });

  const login = useCallback(() => {
    setIsLoading(true);
    setError(null);
    googleLogin();
  }, [googleLogin]);

  const logout = useCallback(() => {
    setUser(null);
    setSystemIds(null);
    setAccessToken('');
  }, []);

  const refreshSystemData = useCallback(async () => {
    if (!user || !systemIds) return;
    const [employees, supervisors] = await Promise.all([
      loadEmployees(systemIds.systemSheetId),
      loadSupervisors(systemIds.systemSheetId),
    ]);
    const employee = employees.find(e => e.email.toLowerCase() === user.email.toLowerCase());
    const isSupervisor =
      user.email.toLowerCase() === DEFAULT_SUPERVISOR.toLowerCase() ||
      supervisors.some(s => s.email.toLowerCase() === user.email.toLowerCase());
    setUser(prev => prev ? { ...prev, employee, isSupervisor } : null);
  }, [user, systemIds]);

  // Auto-logout on token expiry
  useEffect(() => {
    if (!user) return;
    const remaining = user.tokenExpiry - Date.now();
    if (remaining <= 0) { logout(); return; }
    const timer = setTimeout(logout, remaining);
    return () => clearTimeout(timer);
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ user, systemIds, login, logout, isLoading, error, refreshSystemData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
