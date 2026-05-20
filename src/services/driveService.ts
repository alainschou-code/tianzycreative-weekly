import { driveCreateFile, driveListFiles } from './googleApi';

const MAIN_FOLDER_ID = import.meta.env.VITE_DRIVE_FOLDER_ID as string;
const SHEET_MIME = 'application/vnd.google-apps.spreadsheet';
const FOLDER_MIME = 'application/vnd.google-apps.folder';

export const findOrCreateWorkFolder = async (): Promise<string> => {
  const res = await driveListFiles(
    `name='新版工作單' and mimeType='${FOLDER_MIME}' and '${MAIN_FOLDER_ID}' in parents and trashed=false`,
  );
  if (res.files.length > 0) return res.files[0].id;

  const folder = await driveCreateFile({
    name: '新版工作單',
    mimeType: FOLDER_MIME,
    parents: [MAIN_FOLDER_ID],
  });
  return folder.id;
};

export const findOrCreateSystemSheet = async (): Promise<string> => {
  const res = await driveListFiles(
    `name='天子系統資料' and mimeType='${SHEET_MIME}' and '${MAIN_FOLDER_ID}' in parents and trashed=false`,
  );
  if (res.files.length > 0) return res.files[0].id;

  const file = await driveCreateFile({
    name: '天子系統資料',
    mimeType: SHEET_MIME,
    parents: [MAIN_FOLDER_ID],
  });
  return file.id;
};

export const findWeeklyReportFile = async (
  workFolderId: string,
  employeeName: string,
  weekStart: string,
): Promise<string | null> => {
  const name = `${employeeName}_週報_${weekStart}`;
  const res = await driveListFiles(
    `name='${name}' and mimeType='${SHEET_MIME}' and '${workFolderId}' in parents and trashed=false`,
  );
  return res.files.length > 0 ? res.files[0].id : null;
};

export const createWeeklyReportFile = async (
  workFolderId: string,
  employeeName: string,
  weekStart: string,
): Promise<string> => {
  const name = `${employeeName}_週報_${weekStart}`;
  const file = await driveCreateFile({
    name,
    mimeType: SHEET_MIME,
    parents: [workFolderId],
  });
  return file.id;
};

export const listAllWeeklyReports = async (workFolderId: string) => {
  const res = await driveListFiles(
    `mimeType='${SHEET_MIME}' and '${workFolderId}' in parents and trashed=false`,
  );
  return res.files;
};
