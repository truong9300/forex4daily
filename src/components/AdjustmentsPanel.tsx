import type { Adjustments } from '../types/editor';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

function Slider({ label, value, min, max, onChange }: SliderProps) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: '#9090b0', fontSize: 12 }}>{label}</span>
        <span style={{ color: '#e0e0f0', fontSize: 12, minWidth: 32, textAlign: 'right' }}>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', height: 3 }}
      />
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid #3a3a5c' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: 'transparent',
          color: '#e0e0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {title}
        <span style={{ color: '#606080', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 12px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';

interface AdjustmentsPanelProps {
  adjustments: Adjustments;
  onChange: (key: keyof Adjustments, value: number) => void;
  onReset: () => void;
  onAutoEnhance: () => void;
}

export function AdjustmentsPanel({ adjustments, onChange, onReset, onAutoEnhance }: AdjustmentsPanelProps) {
  return (
    <div style={{
      width: 260,
      background: '#252538',
      borderLeft: '1px solid #3a3a5c',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #3a3a5c',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ color: '#e0e0f0', fontWeight: 600, fontSize: 13 }}>Adjustments</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onAutoEnhance}
            style={{
              padding: '4px 10px',
              background: '#6c63ff',
              color: '#fff',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            Auto
          </button>
          <button
            onClick={onReset}
            style={{
              padding: '4px 10px',
              background: '#2a2a3e',
              color: '#9090b0',
              borderRadius: 4,
              fontSize: 11,
              border: '1px solid #3a3a5c',
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <Section title="Light">
        <Slider label="Exposure" value={adjustments.exposure} min={-100} max={100} onChange={v => onChange('exposure', v)} />
        <Slider label="Brightness" value={adjustments.brightness} min={-100} max={100} onChange={v => onChange('brightness', v)} />
        <Slider label="Contrast" value={adjustments.contrast} min={-100} max={100} onChange={v => onChange('contrast', v)} />
        <Slider label="Highlights" value={adjustments.highlights} min={-100} max={100} onChange={v => onChange('highlights', v)} />
        <Slider label="Shadows" value={adjustments.shadows} min={-100} max={100} onChange={v => onChange('shadows', v)} />
        <Slider label="Whites" value={adjustments.whites} min={-100} max={100} onChange={v => onChange('whites', v)} />
        <Slider label="Blacks" value={adjustments.blacks} min={-100} max={100} onChange={v => onChange('blacks', v)} />
      </Section>

      <Section title="Color">
        <Slider label="Temperature" value={adjustments.temperature} min={-100} max={100} onChange={v => onChange('temperature', v)} />
        <Slider label="Tint" value={adjustments.tint} min={-100} max={100} onChange={v => onChange('tint', v)} />
        <Slider label="Saturation" value={adjustments.saturation} min={-100} max={100} onChange={v => onChange('saturation', v)} />
        <Slider label="Vibrance" value={adjustments.vibrance} min={-100} max={100} onChange={v => onChange('vibrance', v)} />
        <Slider label="Hue" value={adjustments.hue} min={-180} max={180} onChange={v => onChange('hue', v)} />
      </Section>

      <Section title="Detail">
        <Slider label="Sharpness" value={adjustments.sharpness} min={0} max={100} onChange={v => onChange('sharpness', v)} />
        <Slider label="Clarity" value={adjustments.clarity} min={-100} max={100} onChange={v => onChange('clarity', v)} />
        <Slider label="Noise Reduction" value={adjustments.noiseReduction} min={0} max={100} onChange={v => onChange('noiseReduction', v)} />
      </Section>

      <Section title="Effects">
        <Slider label="Vignette" value={adjustments.vignette} min={-100} max={100} onChange={v => onChange('vignette', v)} />
      </Section>
    </div>
  );
}
