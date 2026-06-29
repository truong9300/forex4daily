import { useState, useEffect, useRef } from 'react';
import { useHeartRate } from '../../hooks/useHeartRate';
import { WaveformCanvas } from './WaveformCanvas';
import { LogPanel } from './LogPanel';

function bpmColor(bpm: number | null): string {
  if (!bpm) return '#555';
  if (bpm < 60) return '#4ab4ff';
  if (bpm < 100) return '#4ade80';
  if (bpm < 120) return '#facc15';
  return '#f87171';
}

function HeartIcon({ bpm, active }: { bpm: number | null; active: boolean }) {
  const scaleRef = useRef(1);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!active || !bpm) return;
    const interval = (60 / bpm) * 1000;
    const pulse = () => {
      setScale(1.25);
      setTimeout(() => setScale(1), 120);
    };
    pulse();
    const id = setInterval(pulse, interval);
    return () => clearInterval(id);
  }, [bpm, active]);

  // keep ref stable for scale
  scaleRef.current = scale;

  return (
    <div style={{
      fontSize: 48,
      transform: `scale(${scale})`,
      transition: 'transform 0.1s ease-out',
      display: 'inline-block',
      filter: active && bpm ? `drop-shadow(0 0 12px ${bpmColor(bpm)})` : 'none',
    }}>
      ❤️
    </div>
  );
}

export function HeartRateApp() {
  const { videoRef, isActive, isReady, bpm, signal, log, error, torchEnabled, start, stop, clearLog } = useHeartRate();
  const [showLog, setShowLog] = useState(false);

  const color = bpmColor(bpm);

  const statusText = (() => {
    if (!isActive) return 'Nhấn Bắt đầu, đặt ngón tay lên camera';
    if (!isReady) return 'Đang thu tín hiệu… giữ ngón tay yên';
    if (!bpm) return 'Đang phân tích nhịp tim…';
    return torchEnabled ? 'Đèn flash đang bật' : 'Đèn flash không khả dụng';
  })();

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#09090f',
      color: '#e0e0f0',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #131320',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>❤️</span>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#f87171', letterSpacing: '-0.3px' }}>
            Đo Nhịp Tim
          </span>
        </div>
        <button
          onClick={() => setShowLog(v => !v)}
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#aaa',
            padding: '6px 14px',
            borderRadius: 20,
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span>📋</span>
          <span>Nhật ký {log.length > 0 ? `(${log.length})` : ''}</span>
        </button>
      </div>

      {showLog ? (
        <LogPanel log={log} onClose={() => setShowLog(false)} onClear={clearLog} />
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 20px 24px', gap: 20, overflow: 'auto' }}>

          {/* Camera + BPM row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {/* Camera preview */}
            <div style={{
              position: 'relative',
              width: 96,
              height: 96,
              borderRadius: '50%',
              overflow: 'hidden',
              border: `3px solid ${isActive ? color : '#222'}`,
              flexShrink: 0,
              boxShadow: isActive && bpm ? `0 0 20px ${color}55` : 'none',
              transition: 'border-color 0.4s, box-shadow 0.4s',
            }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {!isActive && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: '#111',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32,
                }}>
                  📷
                </div>
              )}
            </div>

            {/* BPM display */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{
                  fontSize: 72,
                  fontWeight: 900,
                  color,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                  transition: 'color 0.4s',
                  letterSpacing: '-2px',
                }}>
                  {bpm ?? '--'}
                </span>
                <span style={{ fontSize: 18, color: '#444', fontWeight: 500 }}>BPM</span>
              </div>
              <div style={{ marginTop: 8 }}>
                <HeartIcon bpm={bpm} active={isActive} />
              </div>
            </div>
          </div>

          {/* Status */}
          <div style={{
            fontSize: 13,
            color: '#556',
            textAlign: 'center',
            minHeight: 18,
          }}>
            {statusText}
          </div>

          {/* Waveform */}
          <div style={{
            height: 170,
            borderRadius: 14,
            overflow: 'hidden',
            border: '1px solid #161625',
            flexShrink: 0,
          }}>
            <WaveformCanvas bpm={bpm} signal={signal} isActive={isActive} />
          </div>

          {/* Waveform legend */}
          {isActive && (
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: -10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#555' }}>
                <div style={{ width: 20, height: 2, background: 'rgba(255,120,80,0.9)', borderRadius: 1 }} />
                Sóng nhịp tim
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#555' }}>
                <div style={{ width: 20, height: 2, background: 'rgba(255,80,80,0.25)', borderRadius: 1 }} />
                Tín hiệu camera
              </div>
            </div>
          )}

          {/* Instruction when active */}
          {isActive && !bpm && (
            <div style={{
              background: 'rgba(255,200,50,0.07)',
              border: '1px solid rgba(255,200,50,0.2)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 12,
              color: '#a89050',
              textAlign: 'center',
              lineHeight: 1.6,
            }}>
              💡 Đặt nhẹ đầu ngón tay lên ống kính camera,<br />
              che kín đèn flash. Giữ yên trong vài giây.
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.08)',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 13,
              color: '#f87171',
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* Start / Stop button */}
          <button
            onClick={isActive ? stop : start}
            style={{
              padding: '15px',
              borderRadius: 14,
              border: 'none',
              background: isActive
                ? 'rgba(255,255,255,0.08)'
                : 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)',
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: isActive ? 'none' : '0 4px 24px rgba(220,38,38,0.4)',
              transition: 'all 0.2s',
              letterSpacing: '0.2px',
              marginTop: 'auto',
            }}
          >
            {isActive ? '⏹  Dừng đo' : '▶  Bắt đầu đo'}
          </button>
        </div>
      )}
    </div>
  );
}
