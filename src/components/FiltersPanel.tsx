import { useEffect, useRef } from 'react';
import { applyFilter } from '../utils/imageProcessing';

const FILTERS = [
  { id: 'none', name: 'Original' },
  { id: 'vivid', name: 'Vivid' },
  { id: 'warm', name: 'Warm' },
  { id: 'cool', name: 'Cool' },
  { id: 'sepia', name: 'Sepia' },
  { id: 'grayscale', name: 'B&W' },
  { id: 'vintage', name: 'Vintage' },
  { id: 'noir', name: 'Noir' },
  { id: 'fade', name: 'Fade' },
  { id: 'chrome', name: 'Chrome' },
  { id: 'lomo', name: 'Lomo' },
];

interface FilterThumbProps {
  filterId: string;
  name: string;
  sourceCanvas: HTMLCanvasElement | null;
  selected: boolean;
  onSelect: (id: string) => void;
}

function FilterThumb({ filterId, name, sourceCanvas, selected, onSelect }: FilterThumbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sourceCanvas) return;
    const size = 80;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Crop to square
    const s = Math.min(sourceCanvas.width, sourceCanvas.height);
    const sx = (sourceCanvas.width - s) / 2;
    const sy = (sourceCanvas.height - s) / 2;

    const tmp = document.createElement('canvas');
    tmp.width = size;
    tmp.height = size;
    const tctx = tmp.getContext('2d')!;
    tctx.drawImage(sourceCanvas, sx, sy, s, s, 0, 0, size, size);

    const filtered = filterId === 'none' ? tmp : applyFilter(tmp, filterId);
    ctx.drawImage(filtered, 0, 0);
  }, [filterId, sourceCanvas]);

  return (
    <div
      onClick={() => onSelect(filterId)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        padding: 6,
        borderRadius: 8,
        background: selected ? 'rgba(108,99,255,0.2)' : 'transparent',
        border: selected ? '2px solid #6c63ff' : '2px solid transparent',
        transition: 'all 0.15s',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: 72,
          height: 72,
          borderRadius: 6,
          display: 'block',
          background: '#1e1e2e',
        }}
      />
      <span style={{ fontSize: 10, color: selected ? '#6c63ff' : '#9090b0', fontWeight: selected ? 600 : 400 }}>
        {name}
      </span>
    </div>
  );
}

interface FiltersPanelProps {
  sourceCanvas: HTMLCanvasElement | null;
  selectedFilter: string | null;
  onFilterSelect: (id: string | null) => void;
}

export function FiltersPanel({ sourceCanvas, selectedFilter, onFilterSelect }: FiltersPanelProps) {
  const handleSelect = (id: string) => {
    onFilterSelect(id === 'none' ? null : id);
  };

  return (
    <div style={{ padding: '12px 8px' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 4,
      }}>
        {FILTERS.map(f => (
          <FilterThumb
            key={f.id}
            filterId={f.id}
            name={f.name}
            sourceCanvas={sourceCanvas}
            selected={(selectedFilter === null && f.id === 'none') || selectedFilter === f.id}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
