import { useState, useEffect, useCallback, useRef } from 'react';
import { findWeeklyReportFile, createWeeklyReportFile } from '../services/driveService';
import { initReportSheet, loadWorkItems, saveWorkItems } from '../services/sheetsService';
import type { WorkItem } from '../types';

interface Options {
  employeeName: string;
  employeeEmail: string;
  weekStart: string;
  workFolderId: string;
}

export function useWorkItems({ employeeName, employeeEmail, weekStart, workFolderId }: Options) {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [fileId, setFileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load items when week changes
  useEffect(() => {
    if (!employeeName || !employeeEmail || !weekStart || !workFolderId) return;
    let cancelled = false;

    setLoading(true);
    setIsDirty(false);

    (async () => {
      try {
        let fid = await findWeeklyReportFile(workFolderId, employeeName, weekStart);
        if (!fid) {
          fid = await createWeeklyReportFile(workFolderId, employeeName, weekStart);
          await initReportSheet(fid, employeeName, employeeEmail, weekStart);
        }
        if (cancelled) return;
        const loaded = await loadWorkItems(fid);
        if (cancelled) return;
        setFileId(fid);
        setItems(loaded);
      } catch (err) {
        console.error('Failed to load work items', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [employeeName, employeeEmail, weekStart, workFolderId]);

  const triggerSave = useCallback((nextItems: WorkItem[], fid: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await saveWorkItems(fid, nextItems, employeeName, employeeEmail, weekStart);
        setIsDirty(false);
      } catch (err) {
        console.error('Auto-save failed', err);
      } finally {
        setSaving(false);
      }
    }, 2000);
  }, [employeeName, employeeEmail, weekStart]);

  const updateItems = useCallback((updater: (prev: WorkItem[]) => WorkItem[]) => {
    setItems(prev => {
      const next = updater(prev);
      setIsDirty(true);
      if (fileId) triggerSave(next, fileId);
      return next;
    });
  }, [fileId, triggerSave]);

  const addItem = useCallback((item: WorkItem) => updateItems(prev => [...prev, item]), [updateItems]);

  const updateItem = useCallback((id: string, patch: Partial<WorkItem>) =>
    updateItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i)),
  [updateItems]);

  const removeItem = useCallback((id: string) =>
    updateItems(prev => prev.filter(i => i.id !== id)),
  [updateItems]);

  const saveNow = useCallback(async () => {
    if (!fileId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaving(true);
    try {
      await saveWorkItems(fileId, items, employeeName, employeeEmail, weekStart);
      setIsDirty(false);
    } finally {
      setSaving(false);
    }
  }, [fileId, items, employeeName, employeeEmail, weekStart]);

  return { items, loading, saving, isDirty, addItem, updateItem, removeItem, saveNow };
}
