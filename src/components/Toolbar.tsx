import React from 'react';
import type { Tool } from '../types/editor';

interface ToolbarProps {
  activeTool: Tool;
  onToolChange: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const tools: { id: Tool; icon: string; label: string; shortcut: string }[] = [
  { id: 'select', icon: '↖', label: 'Select', shortcut: 'V' },
  { id: 'crop', icon: '⊡', label: 'Crop', shortcut: 'C' },
  { id: 'brush', icon: '🖌', label: 'Brush', shortcut: 'B' },
  { id: 'eraser', icon: '◻', label: 'Eraser', shortcut: 'E' },
  { id: 'heal', icon: '✦', label: 'Heal', shortcut: 'J' },
  { id: 'clone', icon: '⊕', label: 'Clone Stamp', shortcut: 'S' },
  { id: 'text', icon: 'T', label: 'Text', shortcut: 'T' },
  { id: 'shape', icon: '◻', label: 'Shape', shortcut: 'U' },
  { id: 'eyedropper', icon: '⊘', label: 'Eyedropper', shortcut: 'I' },
  { id: 'zoom', icon: '⊕', label: 'Zoom', shortcut: 'Z' },
  { id: 'pan', icon: '✋', label: 'Pan', shortcut: 'H' },
];

export function Toolbar({ activeTool, onToolChange, onUndo, onRedo, canUndo, canRedo }: ToolbarProps) {
  return (
    <div style={{
      width: 52,
      background: '#1a1a2e',
      borderRight: '1px solid #3a3a5c',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px 0',
      gap: 4,
      userSelect: 'none',
    }}>
      {/* Undo/Redo */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        style={btnStyle(!canUndo)}
      >↩</button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Y)"
        style={btnStyle(!canRedo)}
      >↪</button>

      <div style={{ width: 36, height: 1, background: '#3a3a5c', margin: '4px 0' }} />

      {tools.map(tool => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          title={`${tool.label} (${tool.shortcut})`}
          style={{
            width: 38,
            height: 38,
            borderRadius: 6,
            background: activeTool === tool.id ? '#6c63ff' : 'transparent',
            color: activeTool === tool.id ? '#fff' : '#9090b0',
            fontSize: tool.icon.length === 1 && tool.icon === 'T' ? 18 : 16,
            fontWeight: tool.id === 'text' ? 'bold' : 'normal',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
            border: activeTool === tool.id ? '1px solid #7c73ff' : '1px solid transparent',
          }}
          onMouseEnter={e => {
            if (activeTool !== tool.id)
              (e.currentTarget as HTMLButtonElement).style.background = '#2a2a3e';
          }}
          onMouseLeave={e => {
            if (activeTool !== tool.id)
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          }}
        >
          {tool.icon}
        </button>
      ))}
    </div>
  );
}

function btnStyle(disabled: boolean) {
  return {
    width: 38,
    height: 38,
    borderRadius: 6,
    background: 'transparent',
    color: disabled ? '#3a3a5c' : '#9090b0',
    fontSize: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: '1px solid transparent',
  } as React.CSSProperties;
}
