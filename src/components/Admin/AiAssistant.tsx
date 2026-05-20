import { useState, useEffect, useRef } from 'react';
import type { WorkItem } from '../../types';
import { listAllWeeklyReports } from '../../services/driveService';
import { loadWorkItems } from '../../services/sheetsService';
import { DAY_NAMES, formatDuration } from '../../utils/timeUtils';

interface Props {
  workFolderId: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ReportData {
  employeeName: string;
  weekStart: string;
  items: WorkItem[];
}

const MODEL = 'claude-sonnet-4-6';

function buildContext(reports: ReportData[]): string {
  if (reports.length === 0) return '（目前無任何週報資料）';
  return reports.map(r => {
    const lines = r.items.length === 0
      ? ['  （本週無工作項目）']
      : r.items
          .sort((a, b) => a.day - b.day || a.startSlot - b.startSlot)
          .map(item =>
            `  - ${DAY_NAMES[item.day]} ${item.title}` +
            `${item.projectName ? `（${item.projectName}）` : ''} ` +
            `${formatDuration(item.duration)}` +
            `${item.completed ? ' ✓' : ''}`,
          );
    return `【員工：${r.employeeName}　週次：${r.weekStart}】\n${lines.join('\n')}`;
  }).join('\n\n');
}

export function AiAssistant({ workFolderId }: Props) {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadProgress, setLoadProgress] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const files = await listAllWeeklyReports(workFolderId);
        const parsed = files
          .map(f => {
            const m = f.name.match(/^(.+)_週報_(\d{4}-\d{2}-\d{2})$/);
            return m ? { fileId: f.id, employeeName: m[1], weekStart: m[2] } : null;
          })
          .filter(Boolean) as { fileId: string; employeeName: string; weekStart: string }[];

        const loaded: ReportData[] = [];
        for (let i = 0; i < parsed.length; i++) {
          if (cancelled) return;
          const p = parsed[i];
          setLoadProgress(`載入中 ${i + 1} / ${parsed.length}：${p.employeeName}`);
          try {
            const items = await loadWorkItems(p.fileId);
            loaded.push({ employeeName: p.employeeName, weekStart: p.weekStart, items });
          } catch {
            loaded.push({ employeeName: p.employeeName, weekStart: p.weekStart, items: [] });
          }
        }
        if (!cancelled) setReports(loaded);
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [workFolderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string;
    if (!apiKey) {
      alert('請先在 .env 設定 VITE_ANTHROPIC_API_KEY');
      return;
    }

    const next: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setSending(true);

    try {
      const systemPrompt =
        `你是天子創意的人力資源助理，協助主管分析員工每週工作報表。` +
        `以下是系統內所有員工的週報資料（每格時間為 30 分鐘，✓ 表示已完成）：\n\n` +
        buildContext(reports) +
        `\n\n請根據以上資料回答主管問題，回答簡潔條理清晰，使用繁體中文。`;

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
        throw new Error(err.error?.message ?? `HTTP ${res.status}`);
      }

      const data = await res.json() as { content?: { text?: string }[] };
      const reply = data.content?.[0]?.text ?? '（無回應）';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `錯誤：${err instanceof Error ? err.message : '請求失敗，請重試'}`,
      }]);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  if (loadingData) {
    return (
      <div className="ai-loading">
        <div className="spinner" />
        <p>載入所有員工週報資料中...</p>
        {loadProgress && <p className="ai-load-progress">{loadProgress}</p>}
      </div>
    );
  }

  return (
    <div className="ai-assistant">
      <div className="ai-topbar">
        <h3>AI 助理</h3>
        <span className="ai-data-badge">{reports.length} 份週報已載入</span>
        {messages.length > 0 && (
          <button
            className="btn-secondary"
            style={{ marginLeft: 'auto', fontSize: 12, padding: '4px 10px' }}
            onClick={() => setMessages([])}
          >
            清除對話
          </button>
        )}
      </div>

      <div className="ai-chat">
        {messages.length === 0 && (
          <div className="ai-hint">
            <p>可以詢問例如：</p>
            <ul>
              <li>「這週誰工作量最多？」</li>
              <li>「東門CASA總共花了多少時間？」</li>
              <li>「列出所有員工本週完成的項目」</li>
              <li>「哪位員工還沒填寫週報？」</li>
            </ul>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>
            <div className="ai-bubble">{m.content}</div>
          </div>
        ))}
        {sending && (
          <div className="ai-msg assistant">
            <div className="ai-bubble ai-thinking">
              <div className="spinner-sm" />
              <span>思考中...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="ai-input-row">
        <input
          ref={inputRef}
          className="form-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="詢問關於員工週報的問題..."
          disabled={sending}
        />
        <button
          className="btn-primary"
          onClick={sendMessage}
          disabled={sending || !input.trim()}
        >
          送出
        </button>
      </div>
    </div>
  );
}
