import { useRef, useState } from 'react';
import { downloadCanvas } from '../utils/imageProcessing';

interface MenuItem {
  label: string;
  action?: () => void;
  shortcut?: string;
  disabled?: boolean;
}

interface MenuBarProps {
  hasImage: boolean;
  onOpenFile: (file: File) => void;
  onExport: (format: string) => void;
  getRenderedCanvas: () => HTMLCanvasElement | null;
}

export function MenuBar({ hasImage, onOpenFile, onExport, getRenderedCanvas }: MenuBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onOpenFile(file);
    e.target.value = '';
  };

  const handleExport = (format: string) => {
    const canvas = getRenderedCanvas();
    if (!canvas) return;
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    downloadCanvas(canvas, `edited-photo.${ext}`, format);
    setOpenMenu(null);
  };

  const menuItems: { label: string; items: (MenuItem | { label: 'divider' })[] }[] = [
    {
      label: 'File',
      items: [
        { label: 'Open Image...', action: () => fileInputRef.current?.click() },
        { label: 'divider' },
        { label: 'Export as PNG', action: () => handleExport('image/png'), disabled: !hasImage },
        { label: 'Export as JPEG', action: () => handleExport('image/jpeg'), disabled: !hasImage },
        { label: 'Export as WebP', action: () => handleExport('image/webp'), disabled: !hasImage },
      ],
    },
    {
      label: 'Edit',
      items: [
        { label: 'Undo', action: () => {}, shortcut: 'Ctrl+Z' },
        { label: 'Redo', action: () => {}, shortcut: 'Ctrl+Y' },
        { label: 'divider' },
        { label: 'Reset All Adjustments', action: () => onExport('reset') },
      ],
    },
    {
      label: 'Image',
      items: [
        { label: 'Flip Horizontal', action: () => onExport('flip-h'), disabled: !hasImage },
        { label: 'Flip Vertical', action: () => onExport('flip-v'), disabled: !hasImage },
        { label: 'Rotate 90° CW', action: () => onExport('rotate-cw'), disabled: !hasImage },
        { label: 'Rotate 90° CCW', action: () => onExport('rotate-ccw'), disabled: !hasImage },
      ],
    },
    {
      label: 'View',
      items: [
        { label: 'Zoom In', action: () => onExport('zoom-in'), shortcut: 'Ctrl++' },
        { label: 'Zoom Out', action: () => onExport('zoom-out'), shortcut: 'Ctrl+-' },
        { label: 'Fit to Screen', action: () => onExport('zoom-fit'), shortcut: 'Ctrl+0' },
        { label: '100%', action: () => onExport('zoom-100'), shortcut: 'Ctrl+1' },
      ],
    },
  ];

  return (
    <div style={{
      height: 36,
      background: '#1a1a2e',
      borderBottom: '1px solid #3a3a5c',
      display: 'flex',
      alignItems: 'center',
      userSelect: 'none',
    }} onClick={() => setOpenMenu(null)}>
      {/* Logo */}
      <div style={{
        padding: '0 16px',
        color: '#6c63ff',
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: -0.5,
        borderRight: '1px solid #3a3a5c',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ fontSize: 16 }}>✦</span>
        AI Photo Editor
      </div>

      {/* Menu items */}
      {menuItems.map(menu => (
        <div
          key={menu.label}
          style={{ position: 'relative' }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
            style={{
              padding: '0 14px',
              height: 36,
              background: openMenu === menu.label ? '#252538' : 'transparent',
              color: openMenu === menu.label ? '#e0e0f0' : '#9090b0',
              fontSize: 13,
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = '#e0e0f0';
            }}
            onMouseLeave={e => {
              if (openMenu !== menu.label)
                (e.currentTarget as HTMLButtonElement).style.color = '#9090b0';
            }}
          >
            {menu.label}
          </button>

          {openMenu === menu.label && (
            <div style={{
              position: 'absolute',
              top: 36,
              left: 0,
              background: '#252538',
              border: '1px solid #3a3a5c',
              borderRadius: 6,
              minWidth: 200,
              zIndex: 1000,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}>
              {menu.items.map((item, idx) =>
                item.label === 'divider' ? (
                  <div key={idx} style={{ height: 1, background: '#3a3a5c', margin: '4px 0' }} />
                ) : (
                  <button
                    key={idx}
                    onClick={() => { (item as MenuItem).action?.(); setOpenMenu(null); }}
                    disabled={(item as MenuItem).disabled}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      background: 'transparent',
                      color: (item as MenuItem).disabled ? '#3a3a5c' : '#e0e0f0',
                      textAlign: 'left',
                      fontSize: 13,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: (item as MenuItem).disabled ? 'not-allowed' : 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => {
                      if (!(item as MenuItem).disabled)
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(108,99,255,0.15)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }}
                  >
                    <span>{item.label}</span>
                    {(item as MenuItem).shortcut && (
                      <span style={{ color: '#606080', fontSize: 11 }}>{(item as MenuItem).shortcut}</span>
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
