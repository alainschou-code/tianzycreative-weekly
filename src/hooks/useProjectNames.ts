import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadProjectNames } from '../services/sheetsService';
export function useProjectNames() {
  const { user } = useAuth();
  const [projectNames, setProjectNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user?.accessToken) return;
    loadProjectNames()
      .then(names => { console.log('projectNames loaded:', names); setProjectNames(names); })
      .catch(() => setProjectNames([]))
      .finally(() => setLoading(false));
  }, [user?.accessToken]);
  return { projectNames, loading };
}
