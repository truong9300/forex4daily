import type { LogEntry } from '../../hooks/useHeartRate';

interface Props {
  log: LogEntry[];
  onClose: () => void;
  onClear: () => void;
}

function bpmCategory(bpm: number): { label: string; color: string } {
  if (bpm < 60) return { label: 'Nhịp chậm', color: '#4ab4ff' };
  if (bpm < 100) return { label: 'Bình thường', color: '#4ade80' };
  if (bpm < 120) return { label: 'Cao', color: '#facc15' };
  return { label: 'Rất cao', color: '#f87171' };
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function LogPanel({ log, onClose, onClear }: Props) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '0 20px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1a1a2e',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#e0e0f0' }}>
          Lịch sử đo ({log.length})
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {log.length > 0 && (
            <button
              onClick={onClear}
              style={{
                background: 'rgba(255,70,70,0.12)',
                border: '1px solid rgba(255,70,70,0.3)',
                color: '#f87171',
                padding: '5px 12px',
                borderRadius: 20,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Xóa tất cả
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: '#aaa',
              padding: '5px 12px',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Đóng
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {log.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#444', marginTop: 60, fontSize: 14 }}>
            Chưa có lần đo nào
          </div>
        ) : (
          log.map((entry, idx) => {
            const cat = bpmCategory(entry.bpm);
            const isLatest = idx === 0;
            return (
              <div
                key={entry.id}
                style={{
                  background: isLatest ? 'rgba(255,70,70,0.06)' : '#0f0f1e',
                  border: `1px solid ${isLatest ? 'rgba(255,70,70,0.25)' : '#1a1a2e'}`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  marginBottom: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: cat.color, fontVariantNumeric: 'tabular-nums' }}>
                      {entry.bpm}
                    </span>
                    <span style={{ fontSize: 13, color: '#666' }}>BPM</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#555', marginTop: 3 }}>
                    {formatDate(entry.timestamp)} · {formatTime(entry.timestamp)}
                    {' · '}{entry.duration}s
                  </div>
                </div>
                <div style={{
                  background: cat.color + '1a',
                  color: cat.color,
                  border: `1px solid ${cat.color}44`,
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                }}>
                  {cat.label}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
