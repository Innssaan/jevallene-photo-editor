import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyFileCard } from '../components/EmptyFileCard';
import { SessionCrudBar } from '../components/SessionCrudBar';
import { useStudio } from '../context/StudioContext';
import { validateAndLoadImage } from '../utils/imageValidation';

export const HapusLatarPage: React.FC = () => {
  const { addProject, setLastProcessed } = useStudio();

  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [currentName, setCurrentName] = useState<string>('Belum ada gambar');

  // Real-time segmentation controls
  const [targetColor, setTargetColor] = useState('#e2dcd3');
  const [tolerance, setTolerance] = useState(28);
  const [feather, setFeather] = useState(12);
  const [autoSample, setAutoSample] = useState(true);

  // Backdrop & Preview controls
  const [backdropMode, setBackdropMode] = useState<'transparent' | 'solid' | 'blur'>('transparent');
  const [solidColor, setSolidColor] = useState('#1b1b1c');
  const [blurAmount, setBlurAmount] = useState(10);
  const [zoom, setZoom] = useState(100);
  const [inverted, setInverted] = useState(false);

  // Interactive Before/After Split Slider (like Editor Foto)
  const [splitEnabled, setSplitEnabled] = useState(true);
  const [splitMode, setSplitMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [splitPos, setSplitPos] = useState(50);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingSplit = useRef(false);

  const handleLoadImage = async (file: File) => {
    setErrorMsg(null);
    try {
      const loaded = await validateAndLoadImage(file);
      setCurrentSrc(loaded.url);
      setCurrentName(file.name);
      setAutoSample(true);
      setLastProcessed({
        name: file.name,
        url: loaded.url,
        width: loaded.width,
        height: loaded.height,
        sizeBytes: file.size,
        mimeType: file.type,
        sourceTab: 'Hapus Latar',
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat gambar.');
    }
  };

  // Real-time Canvas background removal whenever image, targetColor, tolerance, feather, or inverted changes
  useEffect(() => {
    if (!currentSrc || !processedCanvasRef.current) return;
    const canvas = processedCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.naturalWidth || 900;
      canvas.height = img.naturalHeight || 640;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      try {
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;

        let rT = parseInt(targetColor.slice(1, 3), 16);
        let gT = parseInt(targetColor.slice(3, 5), 16);
        let bT = parseInt(targetColor.slice(5, 7), 16);

        // Auto-sample top-left corner pixel if enabled
        if (autoSample && data.length >= 4) {
          rT = data[0];
          gT = data[1];
          bT = data[2];
          const detectedHex =
            '#' +
            [rT, gT, bT]
              .map((v) => v.toString(16).padStart(2, '0'))
              .join('');
          if (detectedHex !== targetColor) {
            setTargetColor(detectedHex);
          }
          setAutoSample(false);
        }

        const hardDist = tolerance * 2.55;
        const softDist = hardDist + feather * 3;

        for (let i = 0; i < data.length; i += 4) {
          const dr = data[i] - rT;
          const dg = data[i + 1] - gT;
          const db = data[i + 2] - bT;
          const dist = Math.sqrt(dr * dr + dg * dg + db * db);

          let alphaFactor = 1;
          if (dist <= hardDist) {
            alphaFactor = 0;
          } else if (dist < softDist && softDist > hardDist) {
            alphaFactor = (dist - hardDist) / (softDist - hardDist);
          }

          if (inverted) {
            alphaFactor = 1 - alphaFactor;
          }

          data[i + 3] = Math.round(data[i + 3] * alphaFactor);
        }
        ctx.putImageData(frame, 0, 0);
      } catch {
        setErrorMsg('Gambar eksternal diblokir CORS. Unggah gambar lokal untuk pemrosesan real-time.');
      }
    };
    img.src = currentSrc;
  }, [currentSrc, targetColor, tolerance, feather, inverted, autoSample]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSplit.current || !splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    if (splitMode === 'vertical') {
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPos(Math.max(5, Math.min(95, pct)));
    } else {
      const pct = ((e.clientY - rect.top) / rect.height) * 100;
      setSplitPos(Math.max(5, Math.min(95, pct)));
    }
  };

  const handleExportPng = () => {
    if (!processedCanvasRef.current) return;
    const outCanvas = document.createElement('canvas');
    outCanvas.width = processedCanvasRef.current.width;
    outCanvas.height = processedCanvasRef.current.height;
    const ctx = outCanvas.getContext('2d');
    if (!ctx) return;

    if (backdropMode === 'solid') {
      ctx.fillStyle = solidColor;
      ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
    }
    ctx.drawImage(processedCanvasRef.current, 0, 0);

    outCanvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const outName = `${currentName.replace(/\.[^.]+$/, '')}_nobg.png`;
      const a = document.createElement('a');
      a.href = url;
      a.download = outName;
      a.click();

      addProject({
        id: `proj-${Date.now()}`,
        name: outName,
        format: 'PNG',
        sizeLabel: `PNG · ${(blob.size / 1024).toFixed(0)} KB`,
        timeAgo: 'Baru saja',
        resolution: `${outCanvas.width} × ${outCanvas.height}`,
        tag: 'Hapus Latar',
        tagColorClass: 'text-secondary',
        badgeText: 'Transparan',
        imageUrl: url,
        alt: outName,
      });
      setLastProcessed({
        name: outName,
        url,
        width: outCanvas.width,
        height: outCanvas.height,
        sizeBytes: blob.size,
        mimeType: 'image/png',
        sourceTab: 'Hapus Latar',
      });
    }, 'image/png');
  };

  return (
    <div className="flex flex-col w-full">
      {/* Sub-Header Ribbon (Consistent with Editor Foto) */}
      <header className="w-full bg-surface-container-low px-gutter py-space-sm flex flex-wrap items-center justify-between gap-space-sm shadow-sm select-none z-20 border-b border-outline-variant/40">
        <div className="flex items-center gap-space-md">
          <Link
            className="w-8 h-8 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
            to="/"
            title="Kembali ke Beranda"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </Link>
          <span className="font-headline-sm text-body-md text-on-surface font-medium truncate max-w-[200px]">
            {currentName}
          </span>
        </div>

        {/* Center Controls: Split Toggle & Mode */}
        <div className="flex items-center gap-space-sm">
          <button
            onClick={() => setSplitEnabled((v) => !v)}
            className={`flex items-center gap-space-xs px-space-sm py-space-xs rounded text-label-md font-label-md transition-colors border ${
              splitEnabled
                ? 'bg-surface-container-high text-secondary border-secondary/40'
                : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">
              splitscreen_left
            </span>
            <span>Bandingkan</span>
          </button>

          {splitEnabled && (
            <button
              type="button"
              onClick={() => setSplitMode((m) => (m === 'vertical' ? 'horizontal' : 'vertical'))}
              className="px-space-sm py-space-xs rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-code-stat text-code-stat border border-outline-variant/30"
            >
              {splitMode === 'vertical' ? 'Vertikal' : 'Horisontal'}
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-space-xs">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleLoadImage(f);
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-space-sm py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md border border-outline-variant/40"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">
              add_photo_alternate
            </span>
            <span>Muat Gambar</span>
          </button>

          <button
            onClick={handleExportPng}
            className="flex items-center gap-1.5 px-space-md py-space-xs rounded bg-primary-container hover:opacity-90 text-on-primary-container font-label-md text-label-md font-semibold shadow-sm"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Ekspor PNG</span>
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

      {/* Main Workspace */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 relative">
        {/* LEFT PANEL */}
        <div className="lg:col-span-4 xl:col-span-3 bg-surface-container-low p-space-md flex flex-col gap-space-lg border-r border-outline-variant/40">
          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-body-md text-on-surface font-medium uppercase tracking-wider">
                Isolasi Latar Real-Time
              </span>
              <button
                onClick={() => {
                  setAutoSample(true);
                  setTolerance(28);
                  setFeather(12);
                  setInverted(false);
                }}
                className="font-code-stat text-code-stat text-primary hover:underline"
                type="button"
              >
                Deteksi Otomatis
              </button>
            </div>

            {/* Target Color Picker */}
            <div className="p-space-sm rounded bg-surface-container flex items-center justify-between border border-outline-variant/30">
              <span className="font-body-sm text-on-surface">Warna Latar Target</span>
              <div className="flex items-center gap-2">
                <span className="font-code-data text-code-data text-outline uppercase">
                  {targetColor}
                </span>
                <input
                  type="color"
                  value={targetColor}
                  onChange={(e) => {
                    setAutoSample(false);
                    setTargetColor(e.target.value);
                  }}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent"
                />
              </div>
            </div>

            {/* Tolerance Slider */}
            <div className="flex flex-col gap-1.5 p-space-sm rounded bg-surface-container border border-outline-variant/30">
              <div className="flex justify-between items-center">
                <label className="font-body-sm text-on-surface">Toleransi Warna</label>
                <span className="font-code-data text-primary">{tolerance}%</span>
              </div>
              <input
                className="w-full h-1.5 bg-surface-container-highest rounded appearance-none cursor-pointer accent-primary"
                max={100}
                min={1}
                type="range"
                value={tolerance}
                onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
              />
            </div>

            {/* Soft Edge Feathering Slider */}
            <div className="flex flex-col gap-1.5 p-space-sm rounded bg-surface-container border border-outline-variant/30">
              <div className="flex justify-between items-center">
                <label className="font-body-sm text-on-surface">Kehalusan Tepi (Feather)</label>
                <span className="font-code-data text-secondary">{feather} px</span>
              </div>
              <input
                className="w-full h-1.5 bg-surface-container-highest rounded appearance-none cursor-pointer accent-secondary"
                max={40}
                min={0}
                type="range"
                value={feather}
                onChange={(e) => setFeather(parseInt(e.target.value, 10))}
              />
            </div>
          </div>

          {/* Backdrop Mode */}
          <div className="flex flex-col gap-space-sm mt-auto pt-space-md border-t border-outline-variant/30">
            <span className="font-code-stat text-code-stat uppercase tracking-wider text-outline">
              Ganti Latar Belakang
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'transparent', label: 'Transparan' },
                { id: 'solid', label: 'Solid' },
                { id: 'blur', label: 'Blur' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setBackdropMode(m.id as typeof backdropMode)}
                  className={`py-2 px-1 rounded font-code-stat border transition-colors ${
                    backdropMode === m.id
                      ? 'bg-primary-container text-on-primary-container border-primary font-semibold'
                      : 'bg-surface-container text-on-surface border-outline-variant/40'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {backdropMode === 'solid' && (
              <div className="flex items-center justify-between p-space-sm rounded bg-surface-container border border-outline-variant/30">
                <span className="font-body-sm text-on-surface">Warna Pengganti</span>
                <input
                  type="color"
                  value={solidColor}
                  onChange={(e) => setSolidColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </div>
            )}

            {backdropMode === 'blur' && (
              <div className="flex flex-col gap-1 p-space-sm rounded bg-surface-container border border-outline-variant/30">
                <div className="flex justify-between text-label-sm">
                  <span>Intensitas Blur</span>
                  <span className="text-primary">{blurAmount}px</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={24}
                  value={blurAmount}
                  onChange={(e) => setBlurAmount(parseInt(e.target.value, 10))}
                  className="w-full accent-primary"
                />
              </div>
            )}
          </div>
        </div>

        {/* CENTER CANVAS WITH INTERACTIVE BEFORE / AFTER SPLIT */}
        <div className="lg:col-span-8 xl:col-span-9 bg-surface-container-lowest relative flex flex-col items-center justify-between min-h-[560px] p-gutter overflow-hidden select-none">
          <div className="relative flex-1 w-full flex items-center justify-center">
            {!currentSrc ? (
              <EmptyFileCard
                subtitle="Tarik dan lepas berkas foto ke sini, atau telusuri penyimpanan lokal Anda untuk menghapus latar belakang."
                onSelectClick={() => fileInputRef.current?.click()}
                onFileDrop={handleLoadImage}
              />
            ) : (
            <div
              ref={splitContainerRef}
              onPointerDown={() => {
                isDraggingSplit.current = true;
              }}
              onPointerUp={() => {
                isDraggingSplit.current = false;
              }}
              onPointerLeave={() => {
                isDraggingSplit.current = false;
              }}
              onPointerMove={handlePointerMove}
              style={{
                transform: `scale(${zoom / 100})`,
                backgroundColor: backdropMode === 'solid' ? solidColor : undefined,
              }}
              className={`relative w-full max-w-4xl aspect-[16/10] rounded-lg shadow-2xl overflow-hidden cursor-crosshair border border-outline-variant/40 transition-transform duration-150 ${
                backdropMode === 'transparent' ? 'checkerboard-bg' : ''
              }`}
            >
              {/* Optional Blurred Original Backdrop */}
              {backdropMode === 'blur' && (
                <img
                  src={currentSrc}
                  alt="Blurred background"
                  className="absolute inset-0 w-full h-full object-contain scale-105"
                  style={{ filter: `blur(${blurAmount}px)` }}
                />
              )}

              {/* Layer 1: AFTER (Real-time Canvas Cutout) */}
              <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                <canvas
                  ref={processedCanvasRef}
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute top-space-sm right-space-sm px-3 py-1 rounded-full bg-surface-container-lowest/85 backdrop-blur-md text-secondary border border-secondary/40 font-code-stat text-code-stat uppercase flex items-center gap-space-2xs pointer-events-none shadow-md">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span>Sesudah (Latar Dihapus)</span>
                </div>
              </div>

              {/* Layer 2: BEFORE (Original Clipped) */}
              {splitEnabled && (
                <>
                  <div
                    className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center bg-surface-container-low"
                    style={{
                      clipPath:
                        splitMode === 'vertical'
                          ? `inset(0 ${100 - splitPos}% 0 0)`
                          : `inset(0 0 ${100 - splitPos}% 0)`,
                    }}
                  >
                    <img
                      className="max-w-full max-h-full object-contain"
                      alt="Original preview"
                      src={currentSrc}
                    />
                    <div className="absolute top-space-sm left-space-sm px-3 py-1 rounded-full bg-surface-container-lowest/85 backdrop-blur-md text-on-surface-variant border border-outline-variant/40 font-code-stat text-code-stat uppercase pointer-events-none shadow-md">
                      Sebelum (Asli)
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
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface-container-high border border-secondary shadow-xl flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined text-[16px]">drag_indicator</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            )}
          </div>

          {/* Floating Dock */}
          <div className="relative z-20 mt-space-sm bg-surface-container-high/95 backdrop-blur-xl px-space-md py-1.5 rounded-full shadow-2xl flex items-center gap-space-sm border border-outline-variant/40">
            <button
              onClick={() => setZoom((z) => Math.max(50, z - 15))}
              className="w-7 h-7 rounded-full hover:bg-surface-container text-on-surface flex items-center justify-center"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">zoom_out</span>
            </button>
            <button
              onClick={() => setZoom(100)}
              className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary border border-primary/30 font-code-stat"
              type="button"
            >
              {zoom}%
            </button>
            <button
              onClick={() => setZoom((z) => Math.min(200, z + 15))}
              className="w-7 h-7 rounded-full hover:bg-surface-container text-on-surface flex items-center justify-center"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">zoom_in</span>
            </button>
            <div className="w-px h-4 bg-outline-variant" />
            <button
              onClick={() => setInverted((v) => !v)}
              className={`px-2.5 py-0.5 rounded-full font-code-stat flex items-center gap-1 ${
                inverted ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">invert_colors</span>
              <span>Balik Masker</span>
            </button>
          </div>
        </div>
      </div>

      <SessionCrudBar
        currentTabLabel="Hapus Latar"
        currentImageUrl={currentSrc}
        currentImageName={currentName}
        onLoadImage={(img) => {
          setCurrentSrc(img.url);
          setCurrentName(img.name);
          setAutoSample(true);
        }}
      />
    </div>
  );
};
