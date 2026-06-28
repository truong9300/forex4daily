interface BrushOptionsProps {
  brushSize: number;
  brushColor: string;
  brushOpacity: number;
  onSizeChange: (v: number) => void;
  onColorChange: (v: string) => void;
  onOpacityChange: (v: number) => void;
}

export function BrushOptions({
  brushSize,
  brushColor,
  brushOpacity,
  onSizeChange,
  onColorChange,
  onOpacityChange,
}: BrushOptionsProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      padding: '6px 16px',
      background: '#252538',
      borderBottom: '1px solid #3a3a5c',
    }}>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 180 }}>
        <span style={{ color: '#9090b0', fontSize: 12, whiteSpace: 'nowrap' }}>Size</span>
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
      <div style={{
        width: Math.min(40, brushSize),
        height: Math.min(40, brushSize),
        borderRadius: '50%',
        background: brushColor,
        opacity: brushOpacity / 100,
        border: '1px solid #3a3a5c',
        flexShrink: 0,
      }} />
    </div>
  );
}
