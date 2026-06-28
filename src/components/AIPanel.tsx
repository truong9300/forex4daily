import { useState } from 'react';

interface AIPanelProps {
  hasImage: boolean;
  isProcessing: boolean;
  processingMessage: string;
  onRemoveBackground: () => void;
  onAutoEnhance: () => void;
  onUpscale: () => void;
  onDenoise: () => void;
  onColorize: () => void;
}

interface AIFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  action: () => void;
  badge?: string;
}

export function AIPanel({
  hasImage,
  isProcessing,
  processingMessage,
  onRemoveBackground,
  onAutoEnhance,
  onUpscale,
  onDenoise,
  onColorize,
}: AIPanelProps) {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const features: AIFeature[] = [
    {
      id: 'remove-bg',
      name: 'Remove Background',
      description: 'MediaPipe Selfie Segmentation (TF.js)',
      icon: '✂️',
      action: onRemoveBackground,
      badge: 'TF.js',
    },
    {
      id: 'auto-enhance',
      name: 'Auto Enhance',
      description: 'Histogram analysis — tối ưu tự động',
      icon: '✨',
      action: onAutoEnhance,
      badge: 'Smart',
    },
    {
      id: 'upscale',
      name: 'AI Upscale 2×',
      description: 'Bicubic interpolation — nét hơn bilinear',
      icon: '⬆️',
      action: onUpscale,
      badge: 'Bicubic',
    },
    {
      id: 'denoise',
      name: 'Denoise',
      description: 'Bilateral filter — giữ cạnh, xóa nhiễu',
      icon: '🔇',
      action: onDenoise,
      badge: 'Filter',
    },
    {
      id: 'colorize',
      name: 'Colorize',
      description: 'Smart tone mapping cho ảnh B&W',
      icon: '🎨',
      action: onColorize,
      badge: 'Smart',
    },
  ];

  const handleFeatureClick = (feature: AIFeature) => {
    if (!hasImage || isProcessing) return;
    setActiveFeature(feature.id);
    feature.action();
    setTimeout(() => setActiveFeature(null), 2000);
  };

  return (
    <div style={{ padding: '12px 0' }}>
      {isProcessing && (
        <div style={{
          margin: '0 12px 12px',
          padding: '12px',
          background: 'rgba(108,99,255,0.1)',
          border: '1px solid rgba(108,99,255,0.3)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <div className="spinner" style={{
            width: 16,
            height: 16,
            border: '2px solid #6c63ff',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            flexShrink: 0,
          }} />
          <span style={{ color: '#9090b0', fontSize: 12 }}>{processingMessage}</span>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {features.map(feature => (
        <div
          key={feature.id}
          onClick={() => handleFeatureClick(feature)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            cursor: hasImage && !isProcessing ? 'pointer' : 'not-allowed',
            opacity: hasImage && !isProcessing ? 1 : 0.4,
            background: activeFeature === feature.id ? 'rgba(108,99,255,0.1)' : 'transparent',
            transition: 'background 0.15s',
            borderLeft: activeFeature === feature.id ? '2px solid #6c63ff' : '2px solid transparent',
          }}
          onMouseEnter={e => {
            if (hasImage && !isProcessing)
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)';
          }}
          onMouseLeave={e => {
            if (activeFeature !== feature.id)
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
          }}
        >
          <span style={{ fontSize: 20, flexShrink: 0 }}>{feature.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#e0e0f0', fontSize: 13, fontWeight: 500 }}>
                {feature.name}
              </span>
              {feature.badge && (
                <span style={{
                  background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
                  color: '#fff',
                  fontSize: 9,
                  padding: '1px 5px',
                  borderRadius: 3,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}>
                  {feature.badge}
                </span>
              )}
            </div>
            <div style={{ color: '#606080', fontSize: 11, marginTop: 2 }}>
              {feature.description}
            </div>
          </div>
          <span style={{ color: '#3a3a5c', fontSize: 14 }}>›</span>
        </div>
      ))}

      <div style={{ margin: '16px 12px 8px', padding: '12px', background: '#1e1e2e', borderRadius: 8, border: '1px solid #3a3a5c' }}>
        <div style={{ color: '#6c63ff', fontSize: 11, fontWeight: 600, marginBottom: 6 }}>✦ Công nghệ sử dụng</div>
        <div style={{ color: '#606080', fontSize: 11, lineHeight: 1.8 }}>
          🧠 <b style={{ color: '#9090b0' }}>TF.js</b> — MediaPipe model chạy trong browser<br />
          📊 <b style={{ color: '#9090b0' }}>Histogram</b> — Phân tích thống kê ảnh<br />
          🔬 <b style={{ color: '#9090b0' }}>Bilateral</b> — Edge-preserving filter<br />
          🔷 <b style={{ color: '#9090b0' }}>Bicubic</b> — Nội suy chất lượng cao<br />
          <br />
          <span style={{ color: '#4a4a6a' }}>Xử lý 100% local — không upload ảnh.</span>
        </div>
      </div>
    </div>
  );
}
