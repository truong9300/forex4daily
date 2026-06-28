import type { Layer } from '../types/editor';

interface LayersPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export function LayersPanel({ layers, activeLayerId, onSelectLayer, onToggleVisibility }: LayersPanelProps) {
  return (
    <div style={{ padding: '8px 0' }}>
      {[...layers].reverse().map(layer => (
        <div
          key={layer.id}
          onClick={() => onSelectLayer(layer.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 12px',
            background: activeLayerId === layer.id ? 'rgba(108,99,255,0.15)' : 'transparent',
            borderLeft: activeLayerId === layer.id ? '2px solid #6c63ff' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {/* Thumbnail */}
          <LayerThumb canvas={layer.canvas} />

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: activeLayerId === layer.id ? '#e0e0f0' : '#9090b0',
              fontSize: 12,
              fontWeight: activeLayerId === layer.id ? 500 : 400,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {layer.name}
            </div>
            <div style={{ color: '#606080', fontSize: 10 }}>
              {layer.type} · {layer.opacity}%
            </div>
          </div>

          {/* Visibility toggle */}
          <button
            onClick={e => { e.stopPropagation(); onToggleVisibility(layer.id); }}
            style={{
              background: 'transparent',
              color: layer.visible ? '#6c63ff' : '#3a3a5c',
              fontSize: 14,
              padding: 4,
              borderRadius: 4,
            }}
            title={layer.visible ? 'Hide layer' : 'Show layer'}
          >
            {layer.visible ? '◉' : '○'}
          </button>

          {layer.locked && (
            <span style={{ color: '#606080', fontSize: 12 }}>🔒</span>
          )}
        </div>
      ))}

      {layers.length === 0 && (
        <div style={{ padding: 16, color: '#606080', fontSize: 12, textAlign: 'center' }}>
          No layers yet. Open an image to start.
        </div>
      )}
    </div>
  );
}

function LayerThumb({ canvas }: { canvas: HTMLCanvasElement }) {
  const ref = (el: HTMLCanvasElement | null) => {
    if (!el) return;
    const size = 32;
    el.width = size;
    el.height = size;
    const ctx = el.getContext('2d')!;
    // Checkerboard
    const t = 4;
    for (let y = 0; y < size; y += t) {
      for (let x = 0; x < size; x += t) {
        ctx.fillStyle = (Math.floor(x / t) + Math.floor(y / t)) % 2 === 0 ? '#3a3a5c' : '#2a2a3e';
        ctx.fillRect(x, y, t, t);
      }
    }
    // Draw canvas content
    const s = Math.min(canvas.width, canvas.height);
    const sx = (canvas.width - s) / 2;
    const sy = (canvas.height - s) / 2;
    ctx.drawImage(canvas, sx, sy, s, s, 0, 0, size, size);
  };

  return (
    <canvas
      ref={ref}
      style={{
        width: 32,
        height: 32,
        borderRadius: 4,
        border: '1px solid #3a3a5c',
        flexShrink: 0,
      }}
    />
  );
}
