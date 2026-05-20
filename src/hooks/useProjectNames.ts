import { useState, useEffect } from 'react';
import { loadProjectNames } from '../services/sheetsService';

export function useProjectNames() {
  const [projectNames, setProjectNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectNames()
      .then(setProjectNames)
      .catch(() => setProjectNames([]))
      .finally(() => setLoading(false));
  }, []);

  return { projectNames, loading };
}
