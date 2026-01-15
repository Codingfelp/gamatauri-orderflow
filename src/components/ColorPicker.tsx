import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, X, Check, Pipette } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ColorPickerProps {
  currentColor: string;
  onChange: (color: string) => void;
  label?: string;
}

export const ColorPicker = ({ currentColor, onChange, label }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [alpha, setAlpha] = useState(100);
  const [hexInput, setHexInput] = useState(currentColor || '#ffffff');
  
  const satLightRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  
  // Parse current color on mount
  useEffect(() => {
    if (currentColor) {
      setHexInput(currentColor);
      const hsl = hexToHsl(currentColor);
      if (hsl) {
        setHue(hsl.h);
        setSaturation(hsl.s);
        setLightness(hsl.l);
      }
    }
  }, [currentColor]);

  const hexToHsl = (hex: string): { h: number; s: number; l: number } | null => {
    if (!hex || !hex.startsWith('#')) return null;
    
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h: number, s: number, l: number): string => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const handleSatLightMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!satLightRef.current) return;
    
    const rect = satLightRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    
    setSaturation(x * 100);
    setLightness(100 - y * 100);
    
    const newHex = hslToHex(hue, x * 100, 100 - y * 100);
    setHexInput(newHex);
    onChange(newHex);
  };

  const handleHueMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!hueRef.current) return;
    
    const rect = hueRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newHue = x * 360;
    
    setHue(newHue);
    const newHex = hslToHex(newHue, saturation, lightness);
    setHexInput(newHex);
    onChange(newHex);
  };

  const handleHexChange = (value: string) => {
    setHexInput(value);
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      const hsl = hexToHsl(value);
      if (hsl) {
        setHue(hsl.h);
        setSaturation(hsl.s);
        setLightness(hsl.l);
        onChange(value);
      }
    }
  };

  const presetColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#ffffff', '#000000', '#6b7280',
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg hover:border-primary transition-colors"
      >
        <div 
          className="w-6 h-6 rounded border border-border shadow-inner"
          style={{ backgroundColor: currentColor || '#ffffff' }}
        />
        <Palette className="w-4 h-4 text-muted-foreground" />
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 top-full left-0 mt-2 p-4 bg-popover border border-border rounded-xl shadow-2xl min-w-[280px]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-foreground">Seletor de Cor</span>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Saturation/Lightness picker */}
            <div
              ref={satLightRef}
              className="w-full h-40 rounded-lg cursor-crosshair relative mb-4"
              style={{
                background: `linear-gradient(to bottom, transparent, black), 
                             linear-gradient(to right, white, hsl(${hue}, 100%, 50%))`,
              }}
              onMouseDown={handleSatLightMove}
              onMouseMove={(e) => e.buttons === 1 && handleSatLightMove(e)}
            >
              <div
                className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${saturation}%`,
                  top: `${100 - lightness}%`,
                  backgroundColor: hslToHex(hue, saturation, lightness),
                }}
              />
            </div>

            {/* Hue slider */}
            <div
              ref={hueRef}
              className="w-full h-4 rounded-full cursor-pointer relative mb-4"
              style={{
                background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
              }}
              onMouseDown={handleHueMove}
              onMouseMove={(e) => e.buttons === 1 && handleHueMove(e)}
            >
              <div
                className="absolute w-5 h-5 border-2 border-white rounded-full shadow-lg transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${(hue / 360) * 100}%`,
                  top: '50%',
                  backgroundColor: `hsl(${hue}, 100%, 50%)`,
                }}
              />
            </div>

            {/* Hex input */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">HEX:</span>
              <input
                type="text"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                className="flex-1 px-2 py-1 text-sm bg-muted border border-border rounded font-mono"
                placeholder="#000000"
              />
              <div
                className="w-8 h-8 rounded border border-border"
                style={{ backgroundColor: hexInput }}
              />
            </div>

            {/* Preset colors */}
            <div className="grid grid-cols-10 gap-1">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    setHexInput(color);
                    const hsl = hexToHsl(color);
                    if (hsl) {
                      setHue(hsl.h);
                      setSaturation(hsl.s);
                      setLightness(hsl.l);
                    }
                    onChange(color);
                  }}
                  className="w-6 h-6 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
