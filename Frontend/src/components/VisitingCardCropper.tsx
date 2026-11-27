import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RotateCw, RotateCcw, Crop, X, Sparkles, Move } from 'lucide-react';

interface CropRect {
  x: number; // 0..1 relative to rendered image width
  y: number; // 0..1 relative to rendered image height
  w: number; // 0..1
  h: number; // 0..1
}

type DragHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

interface VisitingCardCropperProps {
  imageSrc: string;
  onConfirmCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const DEFAULT_CROP: CropRect = { x: 0.06, y: 0.08, w: 0.88, h: 0.84 };
const MIN_CROP_SIZE = 0.14;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Generates a rotated data URL from the raw uploaded/captured image so the
 * interactive crop overlay always works cleanly in upright image coordinates.
 */
async function renderRotatedImage(src: string, rotationDeg: number): Promise<string> {
  const normalized = ((rotationDeg % 360) + 360) % 360;
  if (normalized === 0) return src;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const swap = normalized === 90 || normalized === 270;
      const canvas = document.createElement('canvas');
      canvas.width = swap ? ih : iw;
      canvas.height = swap ? iw : ih;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((normalized * Math.PI) / 180);
      ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
      resolve(canvas.toDataURL('image/jpeg', 0.94));
    };
    img.onerror = () => reject(new Error('Failed to load image for rotation.'));
    img.src = src;
  });
}

/**
 * Extracts the exact cropped region at native resolution (capped to 2200px max edge for crisp OCR).
 */
async function exportCroppedCanvas(src: string, crop: CropRect): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;

      const sx = Math.round(clamp(crop.x, 0, 0.95) * iw);
      const sy = Math.round(clamp(crop.y, 0, 0.95) * ih);
      const sw = Math.max(40, Math.round(clamp(crop.w, MIN_CROP_SIZE, 1 - crop.x) * iw));
      const sh = Math.max(40, Math.round(clamp(crop.h, MIN_CROP_SIZE, 1 - crop.y) * ih));

      const maxEdge = 2200;
      const scale = Math.min(1, maxEdge / Math.max(sw, sh));
      const outW = Math.max(40, Math.round(sw * scale));
      const outH = Math.max(40, Math.round(sh * scale));

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, outW, outH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
      resolve(canvas.toDataURL('image/jpeg', 0.94));
    };
    img.onerror = () => reject(new Error('Failed to crop image.'));
    img.src = src;
  });
}

export const VisitingCardCropper: React.FC<VisitingCardCropperProps> = ({
  imageSrc,
  onConfirmCrop,
  onCancel,
  isProcessing = false,
}) => {
  const [rotation, setRotation] = useState(0);
  const [workingSrc, setWorkingSrc] = useState(imageSrc);
  const [crop, setCrop] = useState<CropRect>(DEFAULT_CROP);
  const [isExporting, setIsExporting] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    handle: DragHandle;
    startX: number;
    startY: number;
    startCrop: CropRect;
    stageWidth: number;
    stageHeight: number;
  } | null>(null);

  useEffect(() => {
    setRotation(0);
    setCrop(DEFAULT_CROP);
    setWorkingSrc(imageSrc);
  }, [imageSrc]);

  useEffect(() => {
    let active = true;
    renderRotatedImage(imageSrc, rotation)
      .then((rotated) => {
        if (active) setWorkingSrc(rotated);
      })
      .catch(() => {
        if (active) setWorkingSrc(imageSrc);
      });
    return () => {
      active = false;
    };
  }, [imageSrc, rotation]);

  const startDrag = useCallback(
    (handle: DragHandle, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const stage = stageRef.current;
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      dragStateRef.current = {
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startCrop: { ...crop },
        stageWidth: rect.width,
        stageHeight: rect.height,
      };
    },
    [crop]
  );

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state) return;

      const dx = (e.clientX - state.startX) / state.stageWidth;
      const dy = (e.clientY - state.startY) / state.stageHeight;
      const s = state.startCrop;
      let next: CropRect = { ...s };

      if (state.handle === 'move') {
        next.x = clamp(s.x + dx, 0, 1 - s.w);
        next.y = clamp(s.y + dy, 0, 1 - s.h);
      } else {
        let left = s.x;
        let top = s.y;
        let right = s.x + s.w;
        let bottom = s.y + s.h;

        if (state.handle.includes('w')) {
          left = clamp(s.x + dx, 0, right - MIN_CROP_SIZE);
        }
        if (state.handle.includes('e')) {
          right = clamp(s.x + s.w + dx, left + MIN_CROP_SIZE, 1);
        }
        if (state.handle.includes('n')) {
          top = clamp(s.y + dy, 0, bottom - MIN_CROP_SIZE);
        }
        if (state.handle.includes('s')) {
          bottom = clamp(s.y + s.h + dy, top + MIN_CROP_SIZE, 1);
        }

        next = {
          x: left,
          y: top,
          w: right - left,
          h: bottom - top,
        };
      }

      setCrop(next);
    };

    const handlePointerUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setCrop(DEFAULT_CROP);
  };

  const handleReset = () => {
    setRotation(0);
    setCrop(DEFAULT_CROP);
  };

  const handleConfirm = async () => {
    setIsExporting(true);
    try {
      const croppedUrl = await exportCroppedCanvas(workingSrc, crop);
      onConfirmCrop(croppedUrl);
    } finally {
      setIsExporting(false);
    }
  };

  const busy = isExporting || isProcessing;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
            <Crop className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 font-manrope">
              Crop Visiting Card Before Scanning
            </h4>
            <p className="text-[11px] text-slate-500">
              Drag edges or corners tightly around the card so only printed text is scanned.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="min-h-[36px] px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg inline-flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-50"
        >
          <X className="w-3.5 h-3.5" />
          <span>Change Photo</span>
        </button>
      </div>

      {/* Interactive Crop Viewport */}
      <div className="p-3 sm:p-5 bg-slate-950 flex items-center justify-center select-none">
        <div
          ref={stageRef}
          className="relative inline-block max-w-full touch-none"
          style={{ maxHeight: '56vh' }}
        >
          <img
            src={workingSrc}
            alt="Visiting card to crop"
            draggable={false}
            className="block max-w-full max-h-[54vh] w-auto h-auto object-contain rounded-sm pointer-events-none select-none"
          />

          {/* Shaded Mask Outside Crop Selection */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 bg-slate-950/65 pointer-events-none"
            style={{ height: `${crop.y * 100}%` }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 bg-slate-950/65 pointer-events-none"
            style={{ height: `${(1 - crop.y - crop.h) * 100}%` }}
          />
          <div
            aria-hidden="true"
            className="absolute left-0 bg-slate-950/65 pointer-events-none"
            style={{
              top: `${crop.y * 100}%`,
              height: `${crop.h * 100}%`,
              width: `${crop.x * 100}%`,
            }}
          />
          <div
            aria-hidden="true"
            className="absolute right-0 bg-slate-950/65 pointer-events-none"
            style={{
              top: `${crop.y * 100}%`,
              height: `${crop.h * 100}%`,
              width: `${(1 - crop.x - crop.w) * 100}%`,
            }}
          />

          {/* Draggable Crop Box */}
          <div
            onPointerDown={(e) => startDrag('move', e)}
            style={{
              left: `${crop.x * 100}%`,
              top: `${crop.y * 100}%`,
              width: `${crop.w * 100}%`,
              height: `${crop.h * 100}%`,
              touchAction: 'none',
            }}
            className="absolute border-2 border-blue-400 shadow-[0_0_0_1px_rgba(255,255,255,0.6)] cursor-move"
          >
            {/* Subtle Rule-of-Thirds Guides */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-x-0 top-1/3 border-t border-white/30" />
              <div className="absolute inset-x-0 top-2/3 border-t border-white/30" />
              <div className="absolute inset-y-0 left-1/3 border-l border-white/30" />
              <div className="absolute inset-y-0 left-2/3 border-l border-white/30" />
            </div>

            {/* Center Move Indicator */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="w-7 h-7 rounded-full bg-slate-900/45 text-white/90 flex items-center justify-center backdrop-blur-[1px]">
                <Move className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* 4 Corner Handles (44px touch target around crisp visual corner bracket) */}
            {(
              [
                { key: 'nw', pos: '-left-4 -top-4 cursor-nwse-resize', bar: 'left-3.5 top-3.5 border-l-[3px] border-t-[3px]' },
                { key: 'ne', pos: '-right-4 -top-4 cursor-nesw-resize', bar: 'right-3.5 top-3.5 border-r-[3px] border-t-[3px]' },
                { key: 'sw', pos: '-left-4 -bottom-4 cursor-nesw-resize', bar: 'left-3.5 bottom-3.5 border-l-[3px] border-b-[3px]' },
                { key: 'se', pos: '-right-4 -bottom-4 cursor-nwse-resize', bar: 'right-3.5 bottom-3.5 border-r-[3px] border-b-[3px]' },
              ] as const
            ).map(({ key, pos, bar }) => (
              <div
                key={key}
                role="slider"
                aria-label={`Resize ${key.toUpperCase()} corner`}
                onPointerDown={(e) => startDrag(key, e)}
                style={{ touchAction: 'none' }}
                className={`absolute w-9 h-9 z-20 ${pos}`}
              >
                <span className={`absolute w-4 h-4 border-white ${bar}`} />
              </div>
            ))}

            {/* 4 Edge Handles */}
            <div
              onPointerDown={(e) => startDrag('n', e)}
              style={{ touchAction: 'none' }}
              className="absolute -top-3 left-6 right-6 h-6 cursor-ns-resize z-10 flex items-center justify-center"
            >
              <span className="w-8 h-1 rounded-full bg-white/90 shadow-xs" />
            </div>
            <div
              onPointerDown={(e) => startDrag('s', e)}
              style={{ touchAction: 'none' }}
              className="absolute -bottom-3 left-6 right-6 h-6 cursor-ns-resize z-10 flex items-center justify-center"
            >
              <span className="w-8 h-1 rounded-full bg-white/90 shadow-xs" />
            </div>
            <div
              onPointerDown={(e) => startDrag('w', e)}
              style={{ touchAction: 'none' }}
              className="absolute -left-3 top-6 bottom-6 w-6 cursor-ew-resize z-10 flex items-center justify-center"
            >
              <span className="h-8 w-1 rounded-full bg-white/90 shadow-xs" />
            </div>
            <div
              onPointerDown={(e) => startDrag('e', e)}
              style={{ touchAction: 'none' }}
              className="absolute -right-3 top-6 bottom-6 w-6 cursor-ew-resize z-10 flex items-center justify-center"
            >
              <span className="h-8 w-1 rounded-full bg-white/90 shadow-xs" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="px-4 sm:px-5 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRotate}
            disabled={busy}
            className="min-h-[40px] px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate 90°</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={busy}
            className="min-h-[40px] px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Crop</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{busy ? 'Cropping & Scanning...' : 'Crop & Scan Card'}</span>
        </button>
      </div>
    </div>
  );
};

export default VisitingCardCropper;
