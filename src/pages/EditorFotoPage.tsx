import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyFileCard } from '../components/EmptyFileCard';
import { SessionCrudBar } from '../components/SessionCrudBar';
import { useStudio } from '../context/StudioContext';
import { validateAndLoadImage } from '../utils/imageValidation';

interface EditorSettings {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  temp: number;
  vibrance: number;
  saturation: number;
  preset: 'none' | 'kodachrome' | 'tungsten' | 'mono' | 'warm' | 'cool';
  filterIntensity: number;
  flipH: boolean;
  flipV: boolean;
  rotation: number;
  overlayText: string;
  textSize: number;
  textColor: string;
  textOpacity: number;
  textPosition: 'top' | 'center' | 'bottom' | 'corner';
  borderWidth: number;
  borderColor: string;
  borderRadius: number;
}

const DEFAULT_SETTINGS: EditorSettings = {
  exposure: 0.45,
  contrast: 18,
  highlights: -24,
  shadows: 32,
  temp: 8,
  vibrance: 12,
  saturation: -4,
  preset: 'tungsten',
  filterIntensity: 100,
  flipH: false,
  flipV: false,
  rotation: 0,
  overlayText: '',
  textSize: 32,
  textColor: '#ffffff',
  textOpacity: 85,
  textPosition: 'corner',
  borderWidth: 0,
  borderColor: '#ffffff',
  borderRadius: 0,
};

const RESET_SETTINGS: EditorSettings = {
  ...DEFAULT_SETTINGS,
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  temp: 0,
  vibrance: 0,
  saturation: 0,
  preset: 'none',
};

type AspectOption = 'auto' | 'free' | '1/1' | '4/5' | '16/9' | '9/16';
type ToolTab = 'tone' | 'crop' | 'filters' | 'text' | 'border';

interface FreeCropRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

interface HistoryEntry {
  settings: EditorSettings;
  imageUrl: string;
  imageName: string;
  width?: number;
  height?: number;
  aspect: AspectOption;
  freeCrop: FreeCropRect;
}

export const EditorFotoPage: React.FC = () => {
  const { activeImage, addProject, setLastProcessed } = useStudio();
  const initialUrl = activeImage?.url || '';
  const initialName = activeImage?.name || 'Belum ada gambar';

  const [imageSrc, setImageSrc] = useState<string>(initialUrl);
  const [imageName, setImageName] = useState<string>(initialName);
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS);
  const [activeTool, setActiveTool] = useState<ToolTab>('tone');
  const [aspect, setAspect] = useState<AspectOption>('auto');
  const [freeCrop, setFreeCrop] = useState<FreeCropRect>({ top: 8, right: 8, bottom: 8, left: 8 });

  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      settings: DEFAULT_SETTINGS,
      imageUrl: initialUrl,
      imageName: initialName,
      width: activeImage?.width,
      height: activeImage?.height,
      aspect: 'auto',
      freeCrop: { top: 8, right: 8, bottom: 8, left: 8 },
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [splitEnabled, setSplitEnabled] = useState(true);
  const [splitMode, setSplitMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [splitPos, setSplitPos] = useState(52);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [exportFormat, setExportFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>(
    'image/png'
  );
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingSplit = useRef(false);
  const cropDragMode = useRef<'none' | 'move' | 'nw' | 'ne' | 'sw' | 'se'>('none');
  const cropDragStart = useRef<{ x: number; y: number; rect: FreeCropRect }>({
    x: 0,
    y: 0,
    rect: { top: 8, right: 8, bottom: 8, left: 8 },
  });

  const pushHistory = (entry: HistoryEntry) => {
    const sliced = history.slice(0, historyIndex + 1);
    setHistory([...sliced, entry]);
    setHistoryIndex(sliced.length);
  };

  const updateSettings = (patch: Partial<EditorSettings>, commitHistory = true) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      if (commitHistory) {
        pushHistory({
          settings: next,
          imageUrl: imageSrc,
          imageName,
          aspect,
          freeCrop,
        });
      }
      return next;
    });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIdx = historyIndex - 1;
      const entry = history[nextIdx];
      setHistoryIndex(nextIdx);
      setSettings(entry.settings);
      setAspect(entry.aspect);
      setFreeCrop(entry.freeCrop);
      setImageSrc(entry.imageUrl);
      setImageName(entry.imageName);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const entry = history[nextIdx];
      setHistoryIndex(nextIdx);
      setSettings(entry.settings);
      setAspect(entry.aspect);
      setFreeCrop(entry.freeCrop);
      setImageSrc(entry.imageUrl);
      setImageName(entry.imageName);
    }
  };

  const handleUpload = async (file: File) => {
    setErrorMsg(null);
    try {
      const loaded = await validateAndLoadImage(file);
      setImageSrc(loaded.url);
      setImageName(file.name);
      setLastProcessed({
        name: file.name,
        url: loaded.url,
        width: loaded.width,
        height: loaded.height,
        sizeBytes: file.size,
        mimeType: file.type,
        sourceTab: 'Editor Foto',
      });
      pushHistory({
        settings,
        imageUrl: loaded.url,
        imageName: file.name,
        width: loaded.width,
        height: loaded.height,
        aspect,
        freeCrop,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat gambar.');
    }
  };

  const applyPreset = (preset: EditorSettings['preset']) => {
    const map: Record<EditorSettings['preset'], Partial<EditorSettings>> = {
      none: { preset: 'none', exposure: 0, contrast: 0, temp: 0, saturation: 0, vibrance: 0 },
      kodachrome: { preset: 'kodachrome', exposure: 0.2, contrast: 28, temp: 16, saturation: 18, vibrance: 20 },
      tungsten: { preset: 'tungsten', exposure: 0.45, contrast: 18, temp: -18, saturation: -4, vibrance: 12 },
      mono: { preset: 'mono', exposure: 0.1, contrast: 35, temp: 0, saturation: -100, vibrance: -100 },
      warm: { preset: 'warm', exposure: 0.15, contrast: 10, temp: 30, saturation: 10, vibrance: 15 },
      cool: { preset: 'cool', exposure: 0.05, contrast: 15, temp: -30, saturation: -8, vibrance: 10 },
    };
    updateSettings(map[preset]);
  };

  const cssFilter = useMemo(() => {
    const mult = settings.filterIntensity / 100;
    const brightness = Math.max(
      0.2,
      1 + (settings.exposure * 0.22 + settings.shadows * 0.0015) * mult
    );
    const contrast = Math.max(
      0.2,
      1 + (settings.contrast * 0.006 - settings.highlights * 0.001) * mult
    );
    const saturate = Math.max(
      0,
      1 + (settings.saturation + settings.vibrance * 0.5) * 0.008 * mult
    );
    const sepia = settings.temp > 0 ? settings.temp * 0.0025 * mult : 0;
    const hueRotate = settings.temp < 0 ? settings.temp * 0.15 * mult : 0;
    return `brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(
      2
    )}) saturate(${saturate.toFixed(2)}) sepia(${sepia.toFixed(2)}) hue-rotate(${hueRotate.toFixed(
      1
    )}deg)`;
  }, [settings]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();

    if (aspect === 'free' && cropDragMode.current !== 'none') {
      const dxPct = ((e.clientX - cropDragStart.current.x) / rect.width) * 100;
      const dyPct = ((e.clientY - cropDragStart.current.y) / rect.height) * 100;
      const start = cropDragStart.current.rect;
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

      if (cropDragMode.current === 'move') {
        const w = 100 - start.left - start.right;
        const h = 100 - start.top - start.bottom;
        const newLeft = clamp(start.left + dxPct, 0, 100 - w);
        const newTop = clamp(start.top + dyPct, 0, 100 - h);
        setFreeCrop({
          left: Math.round(newLeft),
          right: Math.round(100 - newLeft - w),
          top: Math.round(newTop),
          bottom: Math.round(100 - newTop - h),
        });
      } else if (cropDragMode.current === 'nw') {
        setFreeCrop({
          ...start,
          left: Math.round(clamp(start.left + dxPct, 0, 85 - start.right)),
          top: Math.round(clamp(start.top + dyPct, 0, 85 - start.bottom)),
        });
      } else if (cropDragMode.current === 'ne') {
        setFreeCrop({
          ...start,
          right: Math.round(clamp(start.right - dxPct, 0, 85 - start.left)),
          top: Math.round(clamp(start.top + dyPct, 0, 85 - start.bottom)),
        });
      } else if (cropDragMode.current === 'sw') {
        setFreeCrop({
          ...start,
          left: Math.round(clamp(start.left + dxPct, 0, 85 - start.right)),
          bottom: Math.round(clamp(start.bottom - dyPct, 0, 85 - start.top)),
        });
      } else if (cropDragMode.current === 'se') {
        setFreeCrop({
          ...start,
          right: Math.round(clamp(start.right - dxPct, 0, 85 - start.left)),
          bottom: Math.round(clamp(start.bottom - dyPct, 0, 85 - start.top)),
        });
      }
      return;
    }

    if (!isDraggingSplit.current) return;
    if (splitMode === 'vertical') {
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.max(5, Math.min(95, pct)));
    } else {
      const pct = ((e.clientY - rect.top) / rect.height) * 100;
      setSplitPos(Math.max(5, Math.min(95, pct)));
    }
  };

  const applyFreeCropToCanvas = () => {
    setErrorMsg(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const isRotated = settings.rotation % 180 !== 0;
      const rawW = isRotated ? img.naturalHeight || 900 : img.naturalWidth || 900;
      const rawH = isRotated ? img.naturalWidth || 640 : img.naturalHeight || 640;

      // Render current rotation/flip onto offscreen canvas first so crop coordinates match 1:1
      const off = document.createElement('canvas');
      off.width = rawW;
      off.height = rawH;
      const octx = off.getContext('2d');
      if (!octx) return;
      octx.translate(rawW / 2, rawH / 2);
      octx.rotate((settings.rotation * Math.PI) / 180);
      octx.scale(settings.flipH ? -1 : 1, settings.flipV ? -1 : 1);
      octx.drawImage(img, -(img.naturalWidth || 900) / 2, -(img.naturalHeight || 640) / 2);

      const sx = Math.round((rawW * freeCrop.left) / 100);
      const sy = Math.round((rawH * freeCrop.top) / 100);
      const sw = Math.max(20, Math.round((rawW * (100 - freeCrop.left - freeCrop.right)) / 100));
      const sh = Math.max(20, Math.round((rawH * (100 - freeCrop.top - freeCrop.bottom)) / 100));

      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(off, sx, sy, sw, sh, 0, 0, sw, sh);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const croppedName = `${imageName.replace(/\.[^.]+$/, '')}_cropped.png`;
        const resetRect: FreeCropRect = { top: 0, right: 0, bottom: 0, left: 0 };
        const nextSettings: EditorSettings = {
          ...settings,
          rotation: 0,
          flipH: false,
          flipV: false,
        };
        setSettings(nextSettings);
        setFreeCrop(resetRect);
        setAspect('auto');
        setImageSrc(url);
        setImageName(croppedName);
        setLastProcessed({
          name: croppedName,
          url,
          width: sw,
          height: sh,
          sizeBytes: blob.size,
          mimeType: 'image/png',
          sourceTab: 'Editor Foto',
        });
        pushHistory({
          settings: nextSettings,
          imageUrl: url,
          imageName: croppedName,
          width: sw,
          height: sh,
          aspect: 'auto',
          freeCrop: resetRect,
        });
      }, 'image/png');
    };
    img.onerror = () =>
      setErrorMsg('Unggah gambar lokal agar "Terapkan Crop" dapat memotong piksel secara langsung.');
    img.src = imageSrc;
  };

  const handleExport = () => {
    setErrorMsg(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const isRotated = settings.rotation % 180 !== 0;
      const rawW = isRotated ? img.naturalHeight : img.naturalWidth;
      const rawH = isRotated ? img.naturalWidth : img.naturalHeight;

      const sxPct = aspect === 'free' ? freeCrop.left / 100 : 0;
      const syPct = aspect === 'free' ? freeCrop.top / 100 : 0;
      const swPct = aspect === 'free' ? Math.max(0.1, 1 - (freeCrop.left + freeCrop.right) / 100) : 1;
      const shPct = aspect === 'free' ? Math.max(0.1, 1 - (freeCrop.top + freeCrop.bottom) / 100) : 1;

      const baseW = Math.round(rawW * swPct);
      const baseH = Math.round(rawH * shPct);
      const bw = settings.borderWidth;

      const canvas = document.createElement('canvas');
      canvas.width = baseW + bw * 2;
      canvas.height = baseH + bw * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (bw > 0) {
        ctx.fillStyle = settings.borderColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.save();
      if (settings.borderRadius > 0) {
        const r = settings.borderRadius;
        ctx.beginPath();
        ctx.roundRect(bw, bw, baseW, baseH, r);
        ctx.clip();
      }

      // Render transformed full image onto an offscreen canvas, then draw cropped region
      const off = document.createElement('canvas');
      off.width = rawW;
      off.height = rawH;
      const octx = off.getContext('2d');
      if (octx) {
        octx.filter = cssFilter;
        octx.translate(rawW / 2, rawH / 2);
        octx.rotate((settings.rotation * Math.PI) / 180);
        octx.scale(settings.flipH ? -1 : 1, settings.flipV ? -1 : 1);
        octx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
        ctx.drawImage(
          off,
          Math.round(rawW * sxPct),
          Math.round(rawH * syPct),
          baseW,
          baseH,
          bw,
          bw,
          baseW,
          baseH
        );
      }
      ctx.restore();

      if (settings.overlayText.trim()) {
        ctx.save();
        ctx.globalAlpha = settings.textOpacity / 100;
        const scaledSize = Math.max(16, Math.round((settings.textSize * baseW) / 900));
        ctx.font = `600 ${scaledSize}px "Space Grotesk", sans-serif`;
        ctx.fillStyle = settings.textColor;
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 8;
        let tx = canvas.width / 2;
        let ty = canvas.height / 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (settings.textPosition === 'top') ty = bw + scaledSize * 1.2;
        else if (settings.textPosition === 'bottom') ty = canvas.height - bw - scaledSize * 1.2;
        else if (settings.textPosition === 'corner') {
          ctx.textAlign = 'right';
          tx = canvas.width - bw - scaledSize;
          ty = canvas.height - bw - scaledSize;
        }
        ctx.fillText(settings.overlayText, tx, ty);
        ctx.restore();
      }

      const ext =
        exportFormat === 'image/png' ? 'png' : exportFormat === 'image/jpeg' ? 'jpg' : 'webp';
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const outName = `${imageName.replace(/\.[^.]+$/, '')}_edited.${ext}`;
          const a = document.createElement('a');
          a.href = url;
          a.download = outName;
          a.click();

          addProject({
            id: `proj-${Date.now()}`,
            name: outName,
            format: ext.toUpperCase(),
            sizeLabel: `${ext.toUpperCase()} · ${(blob.size / (1024 * 1024)).toFixed(1)} MB`,
            timeAgo: 'Baru saja',
            resolution: `${canvas.width} × ${canvas.height}`,
            tag: 'Editor Foto',
            tagColorClass: 'text-secondary',
            badgeIcon: 'done_all',
            imageUrl: url,
            alt: outName,
          });
          setLastProcessed({
            name: outName,
            url,
            width: canvas.width,
            height: canvas.height,
            sizeBytes: blob.size,
            mimeType: exportFormat,
            sourceTab: 'Editor Foto',
          });
          setExportStatus('Diekspor!');
          setTimeout(() => setExportStatus(null), 2500);
        },
        exportFormat,
        0.92
      );
    };
    img.onerror = () => {
      const a = document.createElement('a');
      a.href = imageSrc;
      a.download = imageName;
      a.target = '_blank';
      a.click();
    };
    img.src = imageSrc;
  };

  const aspectClassMap: Record<AspectOption, string> = {
    auto: '',
    free: '',
    '1/1': 'aspect-square max-w-xl',
    '4/5': 'aspect-[4/5] max-w-md',
    '16/9': 'aspect-video',
    '9/16': 'aspect-[9/16] max-w-xs',
  };

  return (
    <div className="flex flex-col w-full">
      {/* Sub-Header Workspace Control Ribbon (Stitch Layout) */}
      <header className="w-full bg-surface-container-low px-gutter py-space-sm flex flex-wrap items-center justify-between gap-space-sm shadow-sm select-none z-20 border-b border-outline-variant/40">
        <div className="flex items-center gap-space-md">
          <Link
            className="w-8 h-8 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
            to="/"
            title="Kembali ke Beranda"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
          <div className="flex items-center gap-space-xs">
            <span className="material-symbols-outlined text-outline text-[18px]">image</span>
            <span className="font-headline-sm text-body-md text-on-surface font-medium tracking-tight max-w-[180px] truncate">
              {imageName}
            </span>
            <span className="font-code-stat text-code-stat px-2.5 py-0.5 rounded-full bg-surface-container-high border border-outline-variant/40 text-outline ml-space-2xs whitespace-nowrap shrink-0 hidden sm:inline">
              {activeImage?.width && activeImage?.height
                ? `${activeImage.width}×${activeImage.height}`
                : '3840×2160'}{' '}
              • 16-BIT
            </span>
          </div>
          <div className="hidden xl:flex items-center gap-space-2xs ml-space-sm px-3 py-1 rounded-full bg-surface-container border border-outline-variant/30 shrink-0">
            <span className="w-2 h-2 rounded-full bg-secondary-fixed" />
            <span className="font-code-data text-code-data text-on-surface-variant whitespace-nowrap">
              Profil ProPhoto RGB
            </span>
          </div>
        </div>

        {/* Center Quick Actions */}
        <div className="flex items-center gap-space-sm">
          <div className="flex items-center bg-surface-container rounded p-space-2xs">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="w-7 h-7 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface disabled:opacity-30 flex items-center justify-center transition-colors"
              title="Urungkan (Ctrl+Z)"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">undo</span>
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="w-7 h-7 rounded hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface disabled:opacity-30 flex items-center justify-center transition-colors"
              title="Ulangi (Ctrl+Shift+Z)"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">redo</span>
            </button>
          </div>

          <button
            onClick={() => setSplitEnabled((v) => !v)}
            className={`flex items-center gap-space-xs px-space-sm py-space-xs rounded text-label-md font-label-md transition-colors ${
              splitEnabled
                ? 'bg-surface-container-high text-secondary border border-secondary/30'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
            }`}
            title="Perbandingan Sebelum / Sesudah"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">
              splitscreen_left
            </span>
            <span>Bandingkan</span>
          </button>

          <div className="hidden sm:flex items-center bg-surface-container rounded px-space-sm py-space-xs">
            <span className="font-code-stat text-code-stat text-outline mr-space-xs">SKALA</span>
            <span className="font-code-data text-code-data text-on-surface w-10 text-right">
              {zoom}%
            </span>
          </div>
        </div>

        {/* Action Right: Upload + Format + Snap Export */}
        <div className="flex items-center gap-space-xs">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors border border-outline-variant/30"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">upload</span>
            <span>Ganti Foto</span>
          </button>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
            className="bg-surface-container text-on-surface font-code-stat text-code-stat px-2 py-1.5 rounded border border-outline-variant/40 outline-none"
          >
            <option value="image/png">PNG</option>
            <option value="image/jpeg">JPG</option>
            <option value="image/webp">WEBP</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-space-xs px-space-md py-space-xs rounded bg-on-surface hover:opacity-90 text-surface-container-lowest font-label-md text-label-md font-semibold transition-all shadow-sm"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">bolt</span>
            <span>{exportStatus || 'Ekspor Cepat'}</span>
          </button>
        </div>
      </header>

      {errorMsg && (
        <div className="mx-gutter mt-space-sm p-space-sm rounded bg-error/10 border border-error/40 text-error font-body-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)}>
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Studio Workspace Main Quad */}
      <div className="relative w-full min-h-[calc(100vh-8rem)] flex flex-col md:flex-row overflow-hidden select-none bg-surface-container-lowest">
        {/* Left Primary Tool Strip */}
        <aside className="w-full md:w-14 bg-surface-container-low flex md:flex-col items-center justify-between py-space-xs md:py-space-md px-space-sm md:px-0 z-20 shadow-md border-b md:border-b-0 md:border-r border-outline-variant/40">
          <div className="flex md:flex-col items-center gap-space-sm">
            {[
              { id: 'tone', icon: 'wb_sunny', title: 'Cahaya & Nada (Exposure/Tone)' },
              { id: 'crop', icon: 'crop', title: 'Pangkas, Rotasi & Flip' },
              { id: 'filters', icon: 'palette', title: 'Preset Filter Studio' },
              { id: 'text', icon: 'title', title: 'Teks & Watermark' },
              { id: 'border', icon: 'rounded_corner', title: 'Bingkai & Sudut' },
            ].map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id as ToolTab)}
                className={`group relative w-10 h-10 rounded flex items-center justify-center transition-all ${
                  activeTool === tool.id
                    ? 'bg-surface-container-high text-on-surface'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
                title={tool.title}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">{tool.icon}</span>
                {activeTool === tool.id && (
                  <div className="hidden md:block absolute -right-1 w-1 h-4 rounded-full bg-secondary" />
                )}
              </button>
            ))}
          </div>

          <div className="hidden md:flex flex-col items-center gap-space-sm">
            <div className="w-6 h-px bg-surface-container-high" />
            <div className="font-code-stat text-code-stat text-outline [writing-mode:vertical-rl] tracking-widest pt-space-xs">
              RAW-ED
            </div>
          </div>
        </aside>

        {/* Compact Adjustment Slider Drawer */}
        <section className="w-full md:w-72 bg-surface-container-low/95 backdrop-blur-md flex flex-col justify-between overflow-y-auto z-10 p-space-md shadow-xl border-r border-outline-variant/30">
          <div className="flex flex-col space-y-space-md">
            <div className="flex items-center justify-between pb-space-xs">
              <div className="flex items-center gap-space-xs">
                <span className="font-headline-sm text-body-md text-on-surface font-medium uppercase tracking-wider">
                  {activeTool === 'tone' && 'Cahaya & Nada'}
                  {activeTool === 'crop' && 'Pangkas & Rotasi'}
                  {activeTool === 'filters' && 'Filter Studio'}
                  {activeTool === 'text' && 'Teks & Watermark'}
                  {activeTool === 'border' && 'Bingkai & Sudut'}
                </span>
                <span className="font-code-stat text-code-stat px-2.5 py-0.5 rounded-full bg-surface-container-high border border-secondary/30 text-secondary whitespace-nowrap">
                  AKTIF
                </span>
              </div>
              <button
                onClick={() => updateSettings(RESET_SETTINGS)}
                className="font-code-stat text-code-stat text-outline hover:text-primary transition-colors"
                type="button"
              >
                SETEL ULANG
              </button>
            </div>

            {activeTool === 'tone' && (
              <>
                <div className="flex flex-col space-y-space-2xs">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E26D46]" />
                      Eksposur
                    </span>
                    <span className="font-code-data text-code-data text-primary">
                      {settings.exposure >= 0 ? '+' : ''}
                      {settings.exposure.toFixed(2)} EV
                    </span>
                  </div>
                  <input
                    className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: '#E26D46' }}
                    max={3}
                    min={-3}
                    step={0.05}
                    type="range"
                    value={settings.exposure}
                    onChange={(e) => updateSettings({ exposure: parseFloat(e.target.value) }, false)}
                  />
                </div>

                <div className="flex flex-col space-y-space-2xs">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E26D46]" />
                      Kontras
                    </span>
                    <span className="font-code-data text-code-data text-primary">
                      {settings.contrast >= 0 ? '+' : ''}
                      {settings.contrast}
                    </span>
                  </div>
                  <input
                    className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: '#E26D46' }}
                    max={100}
                    min={-100}
                    step={1}
                    type="range"
                    value={settings.contrast}
                    onChange={(e) => updateSettings({ contrast: parseInt(e.target.value, 10) }, false)}
                  />
                </div>

                <div className="flex flex-col space-y-space-2xs">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                      Sorotan (Highlights)
                    </span>
                    <span className="font-code-data text-code-data text-[#F59E0B]">
                      {settings.highlights >= 0 ? '+' : ''}
                      {settings.highlights}
                    </span>
                  </div>
                  <input
                    className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: '#F59E0B' }}
                    max={100}
                    min={-100}
                    step={1}
                    type="range"
                    value={settings.highlights}
                    onChange={(e) =>
                      updateSettings({ highlights: parseInt(e.target.value, 10) }, false)
                    }
                  />
                </div>

                <div className="flex flex-col space-y-space-2xs">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
                      Bayangan (Shadows)
                    </span>
                    <span className="font-code-data text-code-data text-[#38BDF8]">
                      {settings.shadows >= 0 ? '+' : ''}
                      {settings.shadows}
                    </span>
                  </div>
                  <input
                    className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: '#0EA5E9' }}
                    max={100}
                    min={-100}
                    step={1}
                    type="range"
                    value={settings.shadows}
                    onChange={(e) => updateSettings({ shadows: parseInt(e.target.value, 10) }, false)}
                  />
                </div>

                <div className="w-full h-px bg-surface-container-high my-space-xs" />

                <div className="flex items-center justify-between pb-space-2xs">
                  <span className="font-headline-sm text-body-md text-on-surface font-medium uppercase tracking-wider">
                    Keseimbangan Warna
                  </span>
                  <span className="font-code-stat text-code-stat text-tertiary">
                    {5200 + settings.temp * 25} K
                  </span>
                </div>

                <div className="flex flex-col space-y-space-2xs">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-sky-400 to-amber-500" />
                      Suhu (Kelvin)
                    </span>
                    <span className="font-code-data text-code-data text-tertiary">
                      {settings.temp >= 0 ? '+' : ''}
                      {settings.temp}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <div className="absolute inset-0 h-1.5 rounded bg-gradient-to-r from-[#0284c7] via-[#202020] to-[#f59e0b] opacity-75" />
                    <input
                      className="relative z-10 w-full h-1.5 bg-transparent rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: '#f0bd8b' }}
                      max={100}
                      min={-100}
                      step={1}
                      type="range"
                      value={settings.temp}
                      onChange={(e) => updateSettings({ temp: parseInt(e.target.value, 10) }, false)}
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-space-2xs">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Dinamika (Vibrance)
                    </span>
                    <span className="font-code-data text-code-data text-secondary">
                      {settings.vibrance >= 0 ? '+' : ''}
                      {settings.vibrance}
                    </span>
                  </div>
                  <input
                    className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: '#7bd6ca' }}
                    max={100}
                    min={-100}
                    step={1}
                    type="range"
                    value={settings.vibrance}
                    onChange={(e) => updateSettings({ vibrance: parseInt(e.target.value, 10) }, false)}
                  />
                </div>

                <div className="flex flex-col space-y-space-2xs">
                  <div className="flex justify-between items-center text-label-sm font-label-sm">
                    <span className="text-on-surface-variant flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                      Kejenuhan (Saturation)
                    </span>
                    <span className="font-code-data text-code-data text-on-surface">
                      {settings.saturation >= 0 ? '+' : ''}
                      {settings.saturation}
                    </span>
                  </div>
                  <input
                    className="w-full h-1 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: '#f43f5e' }}
                    max={100}
                    min={-100}
                    step={1}
                    type="range"
                    value={settings.saturation}
                    onChange={(e) =>
                      updateSettings({ saturation: parseInt(e.target.value, 10) }, false)
                    }
                  />
                </div>
              </>
            )}

            {activeTool === 'crop' && (
              <div className="flex flex-col gap-space-md">
                <button
                  type="button"
                  onClick={() => setAspect('free')}
                  className={`w-full py-2 px-3 rounded-lg font-label-sm flex items-center justify-center gap-1.5 border studio-shadow ${
                    aspect === 'free'
                      ? 'bg-primary-container text-on-primary-container border-primary font-semibold'
                      : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/40'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">crop_free</span>
                  <span>Crop Bebas</span>
                </button>

                {aspect === 'free' && (
                  <div className="p-space-sm rounded bg-surface-container border border-outline-variant/40 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-code-stat text-outline uppercase">
                        Area: {100 - freeCrop.left - freeCrop.right}% ×{' '}
                        {100 - freeCrop.top - freeCrop.bottom}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setFreeCrop({ top: 0, right: 0, bottom: 0, left: 0 })}
                        className="font-code-stat text-primary hover:underline"
                      >
                        Reset
                      </button>
                    </div>
                    <p className="font-code-stat text-[10px] text-outline">
                      Tarik sudut atau kotak crop langsung di atas gambar.
                    </p>
                    <button
                      type="button"
                      onClick={applyFreeCropToCanvas}
                      className="w-full py-1.5 rounded bg-secondary text-on-secondary font-label-sm font-semibold studio-shadow"
                    >
                      Terapkan Crop
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-space-xs">
                  <button
                    type="button"
                    onClick={() => updateSettings({ rotation: (settings.rotation + 90) % 360 })}
                    className="py-2 px-2 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm flex items-center justify-center gap-1 border border-outline-variant/40"
                  >
                    <span className="material-symbols-outlined text-[16px]">rotate_90_degrees_cw</span>
                    <span>Putar 90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ rotation: (settings.rotation + 270) % 360 })}
                    className="py-2 px-2 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm flex items-center justify-center gap-1 border border-outline-variant/40"
                  >
                    <span className="material-symbols-outlined text-[16px]">rotate_90_degrees_ccw</span>
                    <span>Putar -90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ flipH: !settings.flipH })}
                    className={`py-2 px-2 rounded font-label-sm border ${
                      settings.flipH
                        ? 'bg-primary-container text-on-primary-container border-primary'
                        : 'bg-surface-container text-on-surface border-outline-variant/40'
                    }`}
                  >
                    Flip Horisontal
                  </button>
                  <button
                    type="button"
                    onClick={() => updateSettings({ flipV: !settings.flipV })}
                    className={`py-2 px-2 rounded font-label-sm border ${
                      settings.flipV
                        ? 'bg-primary-container text-on-primary-container border-primary'
                        : 'bg-surface-container text-on-surface border-outline-variant/40'
                    }`}
                  >
                    Flip Vertikal
                  </button>
                </div>
              </div>
            )}

            {activeTool === 'filters' && (
              <div className="flex flex-col gap-space-md">
                <div className="grid grid-cols-2 gap-space-xs">
                  {(['none', 'kodachrome', 'tungsten', 'mono', 'warm', 'cool'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className={`py-2 px-2 rounded font-code-stat capitalize border ${
                        settings.preset === p
                          ? 'bg-primary-container text-on-primary-container border-primary font-semibold'
                          : 'bg-surface-container text-on-surface border-outline-variant/40'
                      }`}
                    >
                      {p === 'none' ? 'Asli' : p}
                    </button>
                  ))}
                </div>
                <div>
                  <div className="flex justify-between text-label-sm mb-1">
                    <span className="text-on-surface-variant">Intensitas Filter</span>
                    <span className="font-code-data text-primary">{settings.filterIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={settings.filterIntensity}
                    onChange={(e) =>
                      updateSettings({ filterIntensity: parseInt(e.target.value, 10) }, false)
                    }
                    className="w-full h-1 bg-surface-container-highest rounded accent-primary"
                  />
                </div>
              </div>
            )}

            {activeTool === 'text' && (
              <div className="flex flex-col gap-space-md">
                <input
                  type="text"
                  value={settings.overlayText}
                  onChange={(e) => updateSettings({ overlayText: e.target.value }, false)}
                  placeholder="Teks atau Watermark..."
                  className="bg-surface-container px-space-sm py-space-xs rounded text-on-surface border border-outline-variant/40 outline-none"
                />
                <div>
                  <div className="flex justify-between text-label-sm mb-1">
                    <span>Ukuran</span>
                    <span className="text-primary">{settings.textSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={14}
                    max={96}
                    value={settings.textSize}
                    onChange={(e) => updateSettings({ textSize: parseInt(e.target.value, 10) }, false)}
                    className="w-full h-1 bg-surface-container-highest rounded accent-primary"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-label-sm">Warna Teks</span>
                  <input
                    type="color"
                    value={settings.textColor}
                    onChange={(e) => updateSettings({ textColor: e.target.value }, false)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
                <div className="grid grid-cols-2 gap-space-xs">
                  {[
                    { id: 'top', label: 'Atas' },
                    { id: 'center', label: 'Tengah' },
                    { id: 'bottom', label: 'Bawah' },
                    { id: 'corner', label: 'Sudut Kanan' },
                  ].map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() =>
                        updateSettings({ textPosition: pos.id as EditorSettings['textPosition'] })
                      }
                      className={`py-1.5 rounded font-code-stat border ${
                        settings.textPosition === pos.id
                          ? 'bg-primary-container text-on-primary-container border-primary'
                          : 'bg-surface-container text-on-surface border-outline-variant/40'
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTool === 'border' && (
              <div className="flex flex-col gap-space-md">
                <div>
                  <div className="flex justify-between text-label-sm mb-1">
                    <span>Lebar Bingkai</span>
                    <span className="text-primary">{settings.borderWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={40}
                    value={settings.borderWidth}
                    onChange={(e) =>
                      updateSettings({ borderWidth: parseInt(e.target.value, 10) }, false)
                    }
                    className="w-full h-1 bg-surface-container-highest rounded accent-primary"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-label-sm">Warna Bingkai</span>
                  <input
                    type="color"
                    value={settings.borderColor}
                    onChange={(e) => updateSettings({ borderColor: e.target.value }, false)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-label-sm mb-1">
                    <span>Sudut Melengkung</span>
                    <span className="text-primary">{settings.borderRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={64}
                    value={settings.borderRadius}
                    onChange={(e) =>
                      updateSettings({ borderRadius: parseInt(e.target.value, 10) }, false)
                    }
                    className="w-full h-1 bg-surface-container-highest rounded accent-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Quick Presets Mini Bar (Stitch UI) */}
          <div className="mt-space-md pt-space-sm bg-surface-container p-space-sm rounded flex flex-col gap-space-xs">
            <div className="flex items-center justify-between">
              <span className="font-code-stat text-code-stat text-outline uppercase">
                Preset Studio Cepat
              </span>
              <span className="material-symbols-outlined text-[14px] text-outline">
                auto_fix_high
              </span>
            </div>
            <div className="grid grid-cols-3 gap-space-2xs">
              {(['kodachrome', 'tungsten', 'mono'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className={`py-1 px-space-xs rounded-full font-code-stat text-code-stat text-center transition-colors border truncate capitalize flex items-center justify-center gap-1 ${
                    settings.preset === preset
                      ? 'bg-surface-container-highest text-on-surface font-semibold border-secondary shadow-sm'
                      : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface border-outline-variant/30'
                  }`}
                  type="button"
                >
                  {settings.preset === preset && (
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                  )}
                  <span className="truncate">{preset}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Canvas Central Viewport (Stitch Layout) */}
        <div className="flex-1 relative flex flex-col items-center justify-between overflow-hidden p-space-sm bg-surface-container-lowest">
          <div className="absolute inset-0 opacity-20 pointer-events-none checkerboard-bg" />

          {/* Top Canvas Control Bar */}
          <div className="relative z-20 w-full max-w-4xl flex flex-wrap items-center justify-between gap-space-xs px-space-sm py-space-2xs bg-surface-container-low/95 backdrop-blur-md rounded border border-outline-variant/40 shadow-xl">
            <div className="flex items-center gap-space-sm flex-wrap">
              <span className="font-code-stat text-code-stat text-outline uppercase flex items-center gap-1 shrink-0">
                <span className="material-symbols-outlined text-[14px] text-secondary">crop</span>
                Rasio Aspek:
              </span>
              <div className="flex items-center bg-surface-container rounded-full p-0.5 gap-1 flex-nowrap border border-outline-variant/20">
                {[
                  { id: 'free', label: 'Crop Bebas' },
                  { id: 'auto', label: 'Sesuai Gambar' },
                  { id: '1/1', label: '1:1' },
                  { id: '4/5', label: '4:5 Potret' },
                  { id: '16/9', label: '16:9 Sinema' },
                  { id: '9/16', label: '9:16 Reels' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setAspect(opt.id as AspectOption);
                      if (opt.id === 'free') setActiveTool('crop');
                    }}
                    className={`px-2.5 py-1 rounded-full font-code-stat text-code-stat transition-colors whitespace-nowrap ${
                      aspect === opt.id
                        ? 'bg-surface-container-high text-primary shadow-sm border border-primary/30'
                        : 'hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-space-sm flex-wrap">
              <div className="flex items-center bg-surface-container rounded-full p-0.5 gap-1 border border-outline-variant/20">
                <span className="font-code-stat text-code-stat text-outline px-2 uppercase shrink-0">
                  Mode Split:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSplitEnabled(true);
                    setSplitMode('vertical');
                  }}
                  className={`px-2.5 py-1 rounded-full flex items-center gap-1 font-code-stat text-code-stat ${
                    splitEnabled && splitMode === 'vertical'
                      ? 'bg-surface-container-high text-secondary shadow-sm border border-secondary/30'
                      : 'hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">splitscreen_left</span>
                  <span>Vertikal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSplitEnabled(true);
                    setSplitMode('horizontal');
                  }}
                  className={`px-2.5 py-1 rounded-full flex items-center gap-1 font-code-stat text-code-stat ${
                    splitEnabled && splitMode === 'horizontal'
                      ? 'bg-surface-container-high text-secondary shadow-sm border border-secondary/30'
                      : 'hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">splitscreen_top</span>
                  <span>Horisontal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Photographic Master Canvas Container */}
          <div className="relative flex-1 w-full flex items-center justify-center my-space-xs overflow-hidden">
            {!imageSrc ? (
              <EmptyFileCard
                subtitle="Tarik dan lepas berkas foto ke sini, atau telusuri penyimpanan lokal Anda untuk memulai proses editing."
                onSelectClick={() => fileInputRef.current?.click()}
                onFileDrop={handleUpload}
              />
            ) : (
            <div
              ref={splitContainerRef}
              onPointerDown={() => {
                if (aspect !== 'free') isDraggingSplit.current = true;
              }}
              onPointerUp={() => {
                isDraggingSplit.current = false;
                cropDragMode.current = 'none';
              }}
              onPointerLeave={() => {
                isDraggingSplit.current = false;
                cropDragMode.current = 'none';
              }}
              onPointerMove={handlePointerMove}
              style={{
                transform: `scale(${zoom / 100})`,
                borderWidth: `${settings.borderWidth}px`,
                borderColor: settings.borderColor,
                borderStyle: 'solid',
                borderRadius: `${settings.borderRadius}px`,
              }}
              className={
                aspect === 'free' || aspect === 'auto'
                  ? 'relative inline-block max-w-full bg-surface-container-low shadow-2xl overflow-hidden select-none transition-transform duration-150'
                  : `relative w-full max-w-4xl ${aspectClassMap[aspect]} bg-surface-container-low shadow-2xl overflow-hidden cursor-crosshair select-none transition-transform duration-150`
              }
            >
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none z-20 grid grid-cols-3 grid-rows-3 opacity-40">
                  {Array.from({ length: 9 }).map((_, idx) => (
                    <div key={idx} className="border border-secondary/40" />
                  ))}
                </div>
              )}

              {/* Interactive Free Crop Frame Overlay */}
              {aspect === 'free' && (
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    cropDragMode.current = 'move';
                    cropDragStart.current = { x: e.clientX, y: e.clientY, rect: freeCrop };
                  }}
                  className="absolute z-30 border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] cursor-move"
                  style={{
                    top: `${freeCrop.top}%`,
                    right: `${freeCrop.right}%`,
                    bottom: `${freeCrop.bottom}%`,
                    left: `${freeCrop.left}%`,
                  }}
                >
                  {(['nw', 'ne', 'sw', 'se'] as const).map((corner) => (
                    <div
                      key={corner}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        cropDragMode.current = corner;
                        cropDragStart.current = { x: e.clientX, y: e.clientY, rect: freeCrop };
                      }}
                      className={`absolute w-4 h-4 bg-primary border-2 border-white rounded-sm shadow-md ${
                        corner === 'nw'
                          ? '-top-2 -left-2 cursor-nwse-resize'
                          : corner === 'ne'
                          ? '-top-2 -right-2 cursor-nesw-resize'
                          : corner === 'sw'
                          ? '-bottom-2 -left-2 cursor-nesw-resize'
                          : '-bottom-2 -right-2 cursor-nwse-resize'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Layer 1: AFTER */}
              <div
                className={
                  aspect === 'free' || aspect === 'auto'
                    ? 'relative'
                    : 'absolute inset-0 w-full h-full'
                }
              >
                <img
                  className={
                    aspect === 'free' || aspect === 'auto'
                      ? 'block max-w-full max-h-[460px] w-auto h-auto select-none'
                      : 'w-full h-full object-cover select-none'
                  }
                  style={{
                    filter: cssFilter,
                    transform: `rotate(${settings.rotation}deg) scaleX(${
                      settings.flipH ? -1 : 1
                    }) scaleY(${settings.flipV ? -1 : 1})`,
                  }}
                  alt="Edited preview"
                  src={imageSrc}
                />
                {settings.overlayText.trim() && (
                  <div
                    className={`absolute inset-x-4 pointer-events-none font-headline-sm font-semibold drop-shadow-md ${
                      settings.textPosition === 'top'
                        ? 'top-4 text-center'
                        : settings.textPosition === 'center'
                        ? 'top-1/2 -translate-y-1/2 text-center'
                        : settings.textPosition === 'bottom'
                        ? 'bottom-4 text-center'
                        : 'bottom-4 right-4 text-right'
                    }`}
                    style={{
                      fontSize: `${settings.textSize}px`,
                      color: settings.textColor,
                      opacity: settings.textOpacity / 100,
                    }}
                  >
                    {settings.overlayText}
                  </div>
                )}
                <div className="absolute top-space-sm right-space-sm px-3 py-1 rounded-full bg-surface-container-lowest/85 backdrop-blur-md text-secondary border border-secondary/40 font-code-stat text-code-stat uppercase flex items-center gap-space-2xs pointer-events-none shadow-md">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span>Sesudah (Gradasi Studio)</span>
                </div>
              </div>

              {/* Layer 2: BEFORE */}
              {splitEnabled && aspect !== 'free' && (
                <>
                  <div
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{
                      clipPath:
                        splitMode === 'vertical'
                          ? `inset(0 ${100 - splitPos}% 0 0)`
                          : `inset(0 0 ${100 - splitPos}% 0)`,
                    }}
                  >
                    <img
                      className="w-full h-full object-cover select-none"
                      style={{
                        transform: `rotate(${settings.rotation}deg) scaleX(${
                          settings.flipH ? -1 : 1
                        }) scaleY(${settings.flipV ? -1 : 1})`,
                      }}
                      alt="Original preview"
                      src={imageSrc}
                    />
                    <div className="absolute top-space-sm left-space-sm px-3 py-1 rounded-full bg-surface-container-lowest/85 backdrop-blur-md text-on-surface-variant border border-outline-variant/40 font-code-stat text-code-stat uppercase pointer-events-none shadow-md">
                      Sebelum (RAW Asli)
                    </div>
                  </div>
                  <div
                    className={`absolute z-20 bg-secondary shadow-[0_0_8px_#00f2fe] ${
                      splitMode === 'vertical'
                        ? 'top-0 bottom-0 w-0.5 cursor-ew-resize'
                        : 'left-0 right-0 h-0.5 cursor-ns-resize'
                    }`}
                    style={
                      splitMode === 'vertical'
                        ? { left: `${splitPos}%` }
                        : { top: `${splitPos}%` }
                    }
                  >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface-container-high/95 backdrop-blur-md border border-secondary shadow-xl flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            )}
          </div>

          {/* Floating Minimalist Viewport Dock */}
          <div className="relative z-20 bg-surface-container-high/95 backdrop-blur-xl px-space-md py-1.5 rounded-full shadow-2xl flex items-center gap-space-md border border-outline-variant/40">
            <div className="flex items-center gap-space-2xs">
              <button
                onClick={() => setZoom(100)}
                className="w-7 h-7 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
                title="Sesuaikan Layar (Fit)"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">fit_screen</span>
              </button>
              <button
                onClick={() => setZoom(100)}
                className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary border border-primary/30 font-code-stat text-code-stat"
                type="button"
              >
                {zoom}%
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(200, z + 15))}
                className="w-7 h-7 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
                title="Perbesar (+)"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">zoom_in</span>
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(50, z - 15))}
                className="w-7 h-7 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
                title="Perkecil (-)"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">zoom_out</span>
              </button>
            </div>
            <div className="w-px h-4 bg-outline-variant" />
            <div className="flex items-center gap-space-2xs">
              <button
                onClick={() => updateSettings({ rotation: (settings.rotation + 90) % 360 })}
                className="w-7 h-7 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center"
                title="Rotasi 90°"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">rotate_90_degrees_cw</span>
              </button>
              <button
                onClick={() => setShowGrid((g) => !g)}
                className={`w-7 h-7 rounded-full flex items-center justify-center ${
                  showGrid
                    ? 'bg-surface-container text-secondary'
                    : 'hover:bg-surface-container text-on-surface-variant'
                }`}
                title="Grid Komposisi"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">grid_4x4</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <SessionCrudBar
        currentTabLabel="Editor Foto"
        currentImageUrl={imageSrc}
        currentImageName={imageName}
        onLoadImage={(img) => {
          setImageSrc(img.url);
          setImageName(img.name);
          pushHistory({
            settings,
            imageUrl: img.url,
            imageName: img.name,
            width: img.width,
            height: img.height,
            aspect,
            freeCrop,
          });
        }}
      />
    </div>
  );
};
