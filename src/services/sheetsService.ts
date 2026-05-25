import {
  sheetsGet, sheetsGetValues, sheetsUpdateValues,
  sheetsClearValues, sheetsAddSheet, sheetsBatchUpdate, sheetsAppendValues,
} from './googleApi';
import type { Employee, Supervisor, WorkItem } from '../types';

const PROJECT_SHEET_ID = import.meta.env.VITE_PROJECT_NAMES_SHEET_ID as string;

const EMPLOYEE_SHEET = '員工資料';
const SUPERVISOR_SHEET = '主管帳號';
const EMPLOYEE_HEADERS = ['ID', '姓名', 'Gmail', '部門', '到職日期'];
const SUPERVISOR_HEADERS = ['Gmail', '姓名', '新增日期'];

// ── System sheet setup (idempotent) ────────────────────────────────────────

export const initSystemSheet = async (sheetId: string): Promise<void> => {
  const info = await sheetsGet(sheetId);
  const existingSheets = info.sheets.map(s => ({
    id: s.properties.sheetId,
    title: s.properties.title,
  }));
  const titles = existingSheets.map(s => s.title);

  // Ensure 員工資料 tab exists
  if (!titles.includes(EMPLOYEE_SHEET)) {
    const defaultSheet = existingSheets.find(s => s.title === 'Sheet1');
    if (defaultSheet) {
      // Rename the auto-created "Sheet1" to "員工資料"
      await sheetsBatchUpdate(sheetId, [{
        updateSheetProperties: {
          properties: { sheetId: defaultSheet.id, title: EMPLOYEE_SHEET },
          fields: 'title',
        },
      }]).catch(async () => {
        // Rename failed — add as a new sheet instead
        await sheetsAddSheet(sheetId, EMPLOYEE_SHEET);
      });
    } else {
      await sheetsAddSheet(sheetId, EMPLOYEE_SHEET);
    }
    await sheetsUpdateValues(sheetId, `${EMPLOYEE_SHEET}!A1:E1`, [EMPLOYEE_HEADERS]);
  }

  // Ensure 主管帳號 tab exists
  if (!titles.includes(SUPERVISOR_SHEET)) {
    await sheetsAddSheet(sheetId, SUPERVISOR_SHEET);
    await sheetsUpdateValues(sheetId, `${SUPERVISOR_SHEET}!A1:C1`, [SUPERVISOR_HEADERS]);
    const defaultSupervisor = import.meta.env.VITE_DEFAULT_SUPERVISOR as string;
    await sheetsUpdateValues(sheetId, `${SUPERVISOR_SHEET}!A2:C2`, [
      [defaultSupervisor, '預設主管', new Date().toISOString()],
    ]);
  }
};

// ── Employees ──────────────────────────────────────────────────────────────

export const loadEmployees = async (sheetId: string): Promise<Employee[]> => {
  try {
    const res = await sheetsGetValues(sheetId, `${EMPLOYEE_SHEET}!A2:E`);
    return (res.values ?? [])
      .filter(row => row.length >= 5 && row[0])
      .map(([id, name, email, department, startDate]) => ({
        id, name, email, department, startDate,
      } as Employee));
  } catch {
    return [];
  }
};

export const saveEmployees = async (sheetId: string, employees: Employee[]): Promise<void> => {
  await sheetsClearValues(sheetId, `${EMPLOYEE_SHEET}!A2:E`);
  if (employees.length === 0) return;
  const rows = employees.map(e => [e.id, e.name, e.email, e.department, e.startDate]);
  await sheetsUpdateValues(sheetId, `${EMPLOYEE_SHEET}!A2:E${employees.length + 1}`, rows);
};

/** Append a single new employee row (safe for concurrent first-time registrations) */
export const appendEmployee = async (sheetId: string, employee: Employee): Promise<void> => {
  await sheetsAppendValues(sheetId, `${EMPLOYEE_SHEET}!A:E`, [
    [employee.id, employee.name, employee.email, employee.department, employee.startDate],
  ]);
};

// ── Supervisors ────────────────────────────────────────────────────────────

export const loadSupervisors = async (sheetId: string): Promise<Supervisor[]> => {
  try {
    const res = await sheetsGetValues(sheetId, `${SUPERVISOR_SHEET}!A2:C`);
    return (res.values ?? [])
      .filter(row => row.length >= 1 && row[0])
      .map(([email, name, addedAt]) => ({ email, name: name ?? '', addedAt: addedAt ?? '' } as Supervisor));
  } catch {
    return [];
  }
};

export const saveSupervisors = async (sheetId: string, supervisors: Supervisor[]): Promise<void> => {
  await sheetsClearValues(sheetId, `${SUPERVISOR_SHEET}!A2:C`);
  if (supervisors.length === 0) return;
  const rows = supervisors.map(s => [s.email, s.name, s.addedAt]);
  await sheetsUpdateValues(sheetId, `${SUPERVISOR_SHEET}!A2:C${supervisors.length + 1}`, rows);
};

// ── Weekly reports ─────────────────────────────────────────────────────────

const REPORT_SHEET = '工作項目';
const ITEM_HEADERS = ['ID', 'Day', 'StartSlot', 'Duration', 'Title', 'ProjectName', 'Content', 'Color', 'Completed'];

export const initReportSheet = async (
  fileId: string,
  employeeName: string,
  employeeEmail: string,
  weekStart: string,
): Promise<void> => {
  const info = await sheetsGet(fileId);
  const firstSheet = info.sheets[0];
  if (firstSheet && firstSheet.properties.title !== REPORT_SHEET) {
    await sheetsBatchUpdate(fileId, [{
      updateSheetProperties: {
        properties: { sheetId: firstSheet.properties.sheetId, title: REPORT_SHEET },
        fields: 'title',
      },
    }]);
  }
  await sheetsUpdateValues(fileId, `${REPORT_SHEET}!A1:I1`, [ITEM_HEADERS]);

  await sheetsAddSheet(fileId, '資訊').catch(() => { /* already exists */ });
  await sheetsUpdateValues(fileId, '資訊!A1:D2', [
    ['員工姓名', '員工Email', '週開始日期', '最後儲存'],
    [employeeName, employeeEmail, weekStart, new Date().toISOString()],
  ]);
};

export const loadWorkItems = async (fileId: string): Promise<WorkItem[]> => {
  try {
    const res = await sheetsGetValues(fileId, `${REPORT_SHEET}!A2:I`);
    return (res.values ?? [])
      .filter(row => row.length >= 8 && row[0])
      .map(row => ({
        id: row[0],
        day: Number(row[1]),
        startSlot: Number(row[2]),
        duration: Number(row[3]) || 1,
        title: row[4] ?? '',
        projectName: row[5] ?? '',
        content: row[6] ?? '',
        color: row[7] ?? '#4A90D9',
        completed: row[8] === 'true',  // backward-compatible: missing column = false
      } as WorkItem));
  } catch {
    return [];
  }
};

export const saveWorkItems = async (
  fileId: string,
  items: WorkItem[],
  employeeName: string,
  employeeEmail: string,
  weekStart: string,
): Promise<void> => {
  await sheetsClearValues(fileId, `${REPORT_SHEET}!A2:H`);
  if (items.length > 0) {
    const rows = items.map(i => [
      i.id, i.day, i.startSlot, i.duration, i.title, i.projectName, i.content, i.color,
      i.completed ? 'true' : 'false',
    ]);
    await sheetsUpdateValues(fileId, `${REPORT_SHEET}!A2:I${items.length + 1}`, rows);
  }
  // Update last-saved timestamp
  await sheetsUpdateValues(fileId, '資訊!D2:D2', [[new Date().toISOString()]]).catch(() => {
    return sheetsUpdateValues(fileId, '資訊!A1:D2', [
      ['員工姓名', '員工Email', '週開始日期', '最後儲存'],
      [employeeName, employeeEmail, weekStart, new Date().toISOString()],
    ]);
  });
};

// ── Project names ──────────────────────────────────────────────────────────

export const loadProjectNames = async (): Promise<string[]> => {
  try {
    const res = await sheetsGetValues(PROJECT_SHEET_ID, '建案總表2!C2:C');
    return (res.values ?? []).flat().map(v => v.trim()).filter(Boolean);
  } catch {
    return [];
  }
};
