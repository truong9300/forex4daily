import { useState } from 'react';
import type { Adjustments, Layer } from '../types/editor';
import { AdjustmentsPanel } from './AdjustmentsPanel';
import { FiltersPanel } from './FiltersPanel';
import { LayersPanel } from './LayersPanel';
import { AIPanel } from './AIPanel';

type PanelTab = 'adjustments' | 'filters' | 'layers' | 'ai';

interface RightPanelProps {
  adjustments: Adjustments;
  onAdjustmentChange: (key: keyof Adjustments, value: number) => void;
  onResetAdjustments: () => void;
  onAutoEnhance: () => void;
  sourceCanvas: HTMLCanvasElement | null;
  selectedFilter: string | null;
  onFilterSelect: (id: string | null) => void;
  layers: Layer[];
  activeLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  hasImage: boolean;
  isProcessing: boolean;
  processingMessage: string;
  onRemoveBackground: () => void;
  onUpscale: () => void;
  onDenoise: () => void;
  onColorize: () => void;
  onRestorePhoto: () => void;
  onFaceSwap: (sourceFile: File) => void;
}

const tabs: { id: PanelTab; label: string; icon: string }[] = [
  { id: 'adjustments', label: 'Adjust', icon: '⚙' },
  { id: 'filters', label: 'Filters', icon: '✦' },
  { id: 'layers', label: 'Layers', icon: '◫' },
  { id: 'ai', label: 'AI', icon: '◈' },
];

export function RightPanel(props: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('adjustments');

  return (
    <div style={{
      width: 280,
      background: '#252538',
      borderLeft: '1px solid #3a3a5c',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #3a3a5c',
        background: '#1e1e2e',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: activeTab === tab.id ? '#252538' : 'transparent',
              color: activeTab === tab.id ? '#6c63ff' : '#606080',
              fontSize: 11,
              fontWeight: activeTab === tab.id ? 600 : 400,
              borderBottom: activeTab === tab.id ? '2px solid #6c63ff' : '2px solid transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'adjustments' && (
          <AdjustmentsPanel
            adjustments={props.adjustments}
            onChange={props.onAdjustmentChange}
            onReset={props.onResetAdjustments}
            onAutoEnhance={props.onAutoEnhance}
          />
        )}
        {activeTab === 'filters' && (
          <FiltersPanel
            sourceCanvas={props.sourceCanvas}
            selectedFilter={props.selectedFilter}
            onFilterSelect={props.onFilterSelect}
          />
        )}
        {activeTab === 'layers' && (
          <LayersPanel
            layers={props.layers}
            activeLayerId={props.activeLayerId}
            onSelectLayer={props.onSelectLayer}
            onToggleVisibility={props.onToggleLayerVisibility}
          />
        )}
        {activeTab === 'ai' && (
          <AIPanel
            hasImage={props.hasImage}
            isProcessing={props.isProcessing}
            processingMessage={props.processingMessage}
            onRemoveBackground={props.onRemoveBackground}
            onAutoEnhance={props.onAutoEnhance}
            onUpscale={props.onUpscale}
            onDenoise={props.onDenoise}
            onColorize={props.onColorize}
            onRestorePhoto={props.onRestorePhoto}
            onFaceSwap={props.onFaceSwap}
          />
        )}
      </div>
    </div>
  );
}
