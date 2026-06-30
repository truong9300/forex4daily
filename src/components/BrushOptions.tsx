import type { ShapeType, Tool } from '../types/editor';

interface BrushOptionsProps {
  activeTool: Tool;
  brushSize: number;
  brushColor: string;
  brushOpacity: number;
  shapeType: ShapeType;
  shapeFilled: boolean;
  onSizeChange: (v: number) => void;
  onColorChange: (v: string) => void;
  onOpacityChange: (v: number) => void;
  onShapeTypeChange: (v: ShapeType) => void;
  onShapeFilledChange: (v: boolean) => void;
}

const shapeTypes: { id: ShapeType; label: string; icon: string }[] = [
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'ellipse', label: 'Ellipse', icon: '◯' },
  { id: 'line', label: 'Line', icon: '╱' },
];

export function BrushOptions({
  activeTool,
  brushSize,
  brushColor,
  brushOpacity,
  shapeType,
  shapeFilled,
  onSizeChange,
  onColorChange,
  onOpacityChange,
  onShapeTypeChange,
  onShapeFilledChange,
}: BrushOptionsProps) {
  const isClone = activeTool === 'clone' || activeTool === 'heal';
  const isShape = activeTool === 'shape';
  const sizeLabel = activeTool === 'text' ? 'Font' : isClone ? 'Brush' : 'Size';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      padding: '6px 16px',
      background: '#252538',
      borderBottom: '1px solid #3a3a5c',
      flexWrap: 'wrap',
    }}>
      {isShape && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {shapeTypes.map(s => (
            <button
              key={s.id}
              onClick={() => onShapeTypeChange(s.id)}
              title={s.label}
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: shapeType === s.id ? '#6c63ff' : 'transparent',
                color: shapeType === s.id ? '#fff' : '#9090b0',
                border: '1px solid ' + (shapeType === s.id ? '#7c73ff' : '#3a3a5c'),
                fontSize: 14,
              }}
            >
              {s.icon}
            </button>
          ))}
          {shapeType !== 'line' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9090b0', fontSize: 12, marginLeft: 4 }}>
              <input
                type="checkbox"
                checked={shapeFilled}
                onChange={e => onShapeFilledChange(e.target.checked)}
              />
              Filled
            </label>
          )}
        </div>
      )}

      {isClone && (
        <span style={{ color: '#9090b0', fontSize: 12 }}>
          ⌥ Alt+Click để chọn nguồn, kéo để {activeTool === 'clone' ? 'sao chép' : 'phục hồi'}
        </span>
      )}

      {!isClone && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#9090b0', fontSize: 12, whiteSpace: 'nowrap' }}>Color</span>
          <div style={{ position: 'relative' }}>
            <input
              type="color"
              value={brushColor}
              onChange={e => onColorChange(e.target.value)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                border: '2px solid #3a3a5c',
                cursor: 'pointer',
                padding: 0,
                background: 'none',
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 180 }}>
        <span style={{ color: '#9090b0', fontSize: 12, whiteSpace: 'nowrap' }}>{sizeLabel}</span>
        <input
          type="range"
          min={1}
          max={200}
          value={brushSize}
          onChange={e => onSizeChange(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ color: '#e0e0f0', fontSize: 12, minWidth: 28 }}>{brushSize}px</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 180 }}>
        <span style={{ color: '#9090b0', fontSize: 12, whiteSpace: 'nowrap' }}>Opacity</span>
        <input
          type="range"
          min={1}
          max={100}
          value={brushOpacity}
          onChange={e => onOpacityChange(Number(e.target.value))}
          style={{ flex: 1 }}
        />
        <span style={{ color: '#e0e0f0', fontSize: 12, minWidth: 28 }}>{brushOpacity}%</span>
      </div>

      {/* Preview */}
      {!isClone && (
        <div style={{
          width: Math.min(40, brushSize),
          height: Math.min(40, brushSize),
          borderRadius: isShape && shapeType === 'rectangle' ? 4 : '50%',
          background: brushColor,
          opacity: brushOpacity / 100,
          border: '1px solid #3a3a5c',
          flexShrink: 0,
        }} />
      )}
    </div>
  );
}
