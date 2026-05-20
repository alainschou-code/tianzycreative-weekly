const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_BASE = 'https://www.googleapis.com/drive/v3';

let _token = '';

export const setAccessToken = (token: string) => { _token = token; };
export const getAccessToken = () => _token;

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${_token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Drive ──────────────────────────────────────────────────────────────────

export const driveListFiles = (query: string) =>
  apiFetch<{ files: { id: string; name: string; mimeType: string }[] }>(
    `${DRIVE_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,modifiedTime)&pageSize=100`,
  );

export const driveCreateFile = (body: object) =>
  apiFetch<{ id: string }>(`${DRIVE_BASE}/files`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

// ── Sheets ─────────────────────────────────────────────────────────────────

export const sheetsCreate = (body: object) =>
  apiFetch<{ spreadsheetId: string }>(`${SHEETS_BASE}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const sheetsGet = (id: string) =>
  apiFetch<{ sheets: { properties: { sheetId: number; title: string } }[] }>(
    `${SHEETS_BASE}/${id}?fields=sheets.properties`,
  );

export const sheetsGetValues = (id: string, range: string) =>
  apiFetch<{ values?: string[][] }>(
    `${SHEETS_BASE}/${id}/values/${encodeURIComponent(range)}`,
  );

export const sheetsBatchUpdate = (id: string, requests: object[]) =>
  apiFetch(`${SHEETS_BASE}/${id}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests }),
  });

export const sheetsUpdateValues = (id: string, range: string, values: (string | number)[][]) =>
  apiFetch(`${SHEETS_BASE}/${id}/values/${encodeURIComponent(range)}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
  });

export const sheetsAppendValues = (id: string, range: string, values: (string | number)[][]) =>
  apiFetch(`${SHEETS_BASE}/${id}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    body: JSON.stringify({ range, majorDimension: 'ROWS', values }),
  });

export const sheetsClearValues = (id: string, range: string) =>
  apiFetch(`${SHEETS_BASE}/${id}/values/${encodeURIComponent(range)}:clear`, { method: 'POST' });

export const sheetsAddSheet = (spreadsheetId: string, title: string) =>
  sheetsBatchUpdate(spreadsheetId, [{ addSheet: { properties: { title } } }]);
