export type Department = '企劃部' | '設計部' | '管理部';

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: Department;
  startDate: string; // YYYY-MM-DD
}

export interface Supervisor {
  email: string;
  name: string;
  addedAt: string;
}

export interface WorkItem {
  id: string;
  day: number;       // 0=Mon 1=Tue 2=Wed 3=Thu 4=Fri
  startSlot: number; // 0–15
  duration: number;  // number of 30-min slots
  title: string;
  projectName: string;
  content: string;
  color: string;
  completed: boolean;
}

export interface WeeklyReport {
  employeeEmail: string;
  employeeName: string;
  weekStart: string; // ISO date of Monday
  workItems: WorkItem[];
  fileId?: string;
  sheetId?: string;
  lastSaved?: string;
}

export interface AuthUser {
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
  tokenExpiry: number; // ms timestamp
  employee?: Employee;
  isSupervisor: boolean;
}

export interface SystemIds {
  systemSheetId: string;
  workFolderId: string;
}
