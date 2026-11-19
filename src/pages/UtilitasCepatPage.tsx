import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SessionCrudBar } from '../components/SessionCrudBar';
import { useStudio } from '../context/StudioContext';
import { formatFileSize, validateAndLoadImage } from '../utils/imageValidation';
import { generatePdfFromImages } from '../utils/pdfGenerator';

type UtilityTab = 'compress' | 'resizer' | 'pdf' | 'metadata' | 'picker' | 'splitter';

interface BatchItem {
  id: string;
  name: string;
  ext: string;
  originalBytes: number;
  width: number;
  height: number;
  mimeType: string;
  outputBytes?: number;
  status: 'done' | 'processing' | 'queued';
  src: string;
  outputUrl?: string;
  outputName?: string;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

function rgbToHsl(r: number, g: number, b: number): string {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export const UtilitasCepatPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { setLastProcessed } = useStudio();

  const initialTab = (searchParams.get('tab') as UtilityTab) || 'compress';
  const [activeTab, setActiveTab] = useState<UtilityTab>(initialTab);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get('tab') as UtilityTab | null;
    if (t && ['compress', 'resizer', 'pdf', 'metadata', 'picker', 'splitter'].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const switchTab = (tab: UtilityTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // --- Shared local image for single-image utilities (resizer, metadata, picker, splitter) ---
  const [utilImage, setUtilImage] = useState<{
    name: string;
    url: string;
    width: number;
    height: number;
    sizeBytes: number;
    mimeType: string;
  } | null>(null);

  const singleFileInputRef = useRef<HTMLInputElement>(null);

  const handleSingleUpload = async (file: File) => {
    setErrorMsg(null);
    try {
      const loaded = await validateAndLoadImage(file);
      setUtilImage({
        name: file.name,
        url: loaded.url,
        width: loaded.width,
        height: loaded.height,
        sizeBytes: file.size,
        mimeType: file.type,
      });
      setResizeW(loaded.width);
      setResizeH(loaded.height);
      setLastProcessed({
        name: file.name,
        url: loaded.url,
        width: loaded.width,
        height: loaded.height,
        sizeBytes: file.size,
        mimeType: file.type,
        sourceTab: 'Utilitas Cepat',
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat gambar.');
    }
  };

  // --- TAB 1: Batch Compress & Convert ---
  const [batchQueue, setBatchQueue] = useState<BatchItem[]>([]);
  const [targetMime, setTargetMime] = useState<'image/webp' | 'image/jpeg' | 'image/png'>(
    'image/webp'
  );
  const [quality, setQuality] = useState(85);
  const batchInputRef = useRef<HTMLInputElement>(null);

  const handleBatchFiles = async (files: FileList) => {
    setErrorMsg(null);
    const added: BatchItem[] = [];
    for (const file of Array.from(files)) {
      try {
        const loaded = await validateAndLoadImage(file);
        added.push({
          id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          ext: (file.name.split('.').pop() || 'IMG').toUpperCase(),
          originalBytes: file.size,
          width: loaded.width,
          height: loaded.height,
          mimeType: file.type,
          status: 'queued',
          src: loaded.url,
        });
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Beberapa berkas gagal divalidasi.');
      }
    }
    if (added.length > 0) setBatchQueue((prev) => [...added, ...prev]);
  };

  const runBatch = async () => {
    setBatchQueue((prev) =>
      prev.map((q) => (q.status === 'done' ? q : { ...q, status: 'processing' }))
    );
    const ext = targetMime === 'image/webp' ? 'webp' : targetMime === 'image/jpeg' ? 'jpg' : 'png';
    const nextQueue = await Promise.all(
      batchQueue.map(
        (item) =>
          new Promise<BatchItem>((resolve) => {
            if (item.status === 'done') {
              resolve(item);
              return;
            }
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                resolve({ ...item, status: 'done' });
                return;
              }
              if (targetMime === 'image/jpeg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
              }
              ctx.drawImage(img, 0, 0);
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    resolve({ ...item, status: 'done' });
                    return;
                  }
                  const outUrl = URL.createObjectURL(blob);
                  resolve({
                    ...item,
                    status: 'done',
                    outputBytes: blob.size,
                    outputUrl: outUrl,
                    outputName: `${item.name.replace(/\.[^.]+$/, '')}_conv.${ext}`,
                  });
                },
                targetMime,
                quality / 100
              );
            };
            img.onerror = () => resolve({ ...item, status: 'done' });
            img.src = item.src;
          })
      )
    );
    setBatchQueue(nextQueue);
  };

  // --- TAB 2: Resizer & Flip ---
  const [resizeW, setResizeW] = useState(utilImage?.width || 1920);
  const [resizeH, setResizeH] = useState(utilImage?.height || 1080);
  const [lockAspect, setLockAspect] = useState(true);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  const handleWidthChange = (w: number) => {
    setResizeW(w);
    if (lockAspect && utilImage && utilImage.width > 0) {
      setResizeH(Math.max(1, Math.round((w * utilImage.height) / utilImage.width)));
    }
  };

  const handleHeightChange = (h: number) => {
    setResizeH(h);
    if (lockAspect && utilImage && utilImage.height > 0) {
      setResizeW(Math.max(1, Math.round((h * utilImage.width) / utilImage.height)));
    }
  };

  const exportResized = () => {
    if (!utilImage) return;
    setErrorMsg(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, resizeW);
      canvas.height = Math.max(1, resizeH);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${utilImage.name.replace(/\.[^.]+$/, '')}_${resizeW}x${resizeH}.png`;
        a.click();
      }, 'image/png');
    };
    img.onerror = () =>
      setErrorMsg('Unggah gambar lokal terlebih dahulu agar Canvas dapat memproses piksel.');
    img.src = utilImage.url;
  };

  // --- TAB 3: Image to PDF ---
  const [pdfImages, setPdfImages] = useState<{ id: string; name: string; url: string }[]>([]);
  const [pdfPageSize, setPdfPageSize] = useState<'A4' | 'Letter'>('A4');
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [pdfMargin, setPdfMargin] = useState(24);
  const [pdfBusy, setPdfBusy] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (files: FileList) => {
    setErrorMsg(null);
    const next: { id: string; name: string; url: string }[] = [];
    for (const f of Array.from(files)) {
      try {
        const loaded = await validateAndLoadImage(f);
        next.push({ id: `pdf-${Date.now()}-${Math.random()}`, name: f.name, url: loaded.url });
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat gambar PDF.');
      }
    }
    setPdfImages((prev) => [...prev, ...next]);
  };

  const handleExportPdf = async () => {
    setErrorMsg(null);
    setPdfBusy(true);
    try {
      const blob = await generatePdfFromImages(
        pdfImages.map((p) => ({ imageUrl: p.url, name: p.name })),
        { pageSize: pdfPageSize, orientation: pdfOrientation, marginPt: pdfMargin }
      );
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `jevallene_document_${Date.now()}.pdf`;
      a.click();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal membuat PDF.');
    } finally {
      setPdfBusy(false);
    }
  };

  // --- TAB 5: Color Picker ---
  const pickerCanvasRef = useRef<HTMLCanvasElement>(null);
  const [pickedColor, setPickedColor] = useState<{ hex: string; rgb: string; hsl: string } | null>(
    null
  );
  const [copiedHex, setCopiedHex] = useState(false);

  useEffect(() => {
    if (activeTab !== 'picker' || !utilImage || !pickerCanvasRef.current) return;
    const canvas = pickerCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxW = 720;
      const scale = img.naturalWidth > maxW ? maxW / img.naturalWidth : 1;
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = utilImage.url;
  }, [activeTab, utilImage]);

  const handleCanvasPick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = pickerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * canvas.height);
    try {
      const [r, g, b] = ctx.getImageData(x, y, 1, 1).data;
      setPickedColor({
        hex: rgbToHex(r, g, b),
        rgb: `rgb(${r}, ${g}, ${b})`,
        hsl: rgbToHsl(r, g, b),
      });
    } catch {
      setErrorMsg('Unggah gambar lokal untuk mengambil warna piksel secara akurat.');
    }
  };

  // --- TAB 6: Image Splitter ---
  const [splitRows, setSplitRows] = useState(2);
  const [splitCols, setSplitCols] = useState(2);
  const [splitTiles, setSplitTiles] = useState<{ index: number; url: string }[]>([]);

  const handleSplitImage = () => {
    if (!utilImage) return;
    setErrorMsg(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const tileW = Math.floor(img.naturalWidth / splitCols);
      const tileH = Math.floor(img.naturalHeight / splitRows);
      const tiles: { index: number; url: string }[] = [];
      let idx = 1;
      for (let r = 0; r < splitRows; r++) {
        for (let c = 0; c < splitCols; c++) {
          const canvas = document.createElement('canvas');
          canvas.width = tileW;
          canvas.height = tileH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, c * tileW, r * tileH, tileW, tileH, 0, 0, tileW, tileH);
            tiles.push({ index: idx++, url: canvas.toDataURL('image/png') });
          }
        }
      }
      setSplitTiles(tiles);
    };
    img.onerror = () => setErrorMsg('Unggah gambar lokal untuk memotong grid.');
    img.src = utilImage.url;
  };

  return (
    <div className="px-gutter py-margin max-w-7xl mx-auto w-full flex flex-col gap-margin">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
        <div>
          <span className="font-code-stat text-code-stat uppercase tracking-widest text-primary">
            Image Utilities Suite
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Utilitas Gambar &amp; Konversi Client-Side
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Kompresor, konverter format, resizer, Image-to-PDF, metadata viewer, color picker, dan
            image splitter.
          </p>
        </div>

        <div>
          <input
            ref={singleFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleSingleUpload(f);
            }}
          />
          <button
            type="button"
            onClick={() => singleFileInputRef.current?.click()}
            className="px-space-md py-space-xs rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md flex items-center gap-space-xs shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>Pilih Gambar Kerja</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-space-sm rounded-lg bg-error/10 border border-error/40 text-error font-body-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)}>
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Mode Tabs */}
      <div className="w-full bg-surface-container-low p-1 rounded-xl flex flex-wrap gap-1.5 border border-outline-variant/40">
        {[
          { id: 'compress', icon: 'compress', label: 'Kompres & Konversi' },
          { id: 'resizer', icon: 'photo_size_select_large', label: 'Resizer & Flip' },
          { id: 'pdf', icon: 'picture_as_pdf', label: 'Image to PDF' },
          { id: 'metadata', icon: 'info', label: 'Metadata Viewer' },
          { id: 'picker', icon: 'colorize', label: 'Color Picker' },
          { id: 'splitter', icon: 'grid_on', label: 'Image Splitter' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id as UtilityTab)}
            className={`flex-1 min-w-[140px] px-space-sm py-2 rounded-lg font-body-sm text-body-sm transition-all flex items-center justify-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-surface-container-highest text-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: COMPRESS & CONVERT */}
      {activeTab === 'compress' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin items-start">
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            <div
              onClick={() => batchInputRef.current?.click()}
              className="bg-surface-container-lowest rounded-xl p-space-xl border border-dashed border-outline-variant hover:border-primary text-center cursor-pointer transition-colors"
            >
              <span className="material-symbols-outlined text-[32px] text-primary mb-2">
                file_upload
              </span>
              <p className="font-headline-sm text-on-surface">
                Klik untuk menambahkan gambar ke antrean batch
              </p>
              <p className="font-body-sm text-outline mt-1">
                Mendukung JPG, PNG, WEBP, BMP, GIF (Maks. 50MB/file)
              </p>
              <input
                ref={batchInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleBatchFiles(e.target.files);
                }}
              />
            </div>

            {batchQueue.length === 0 ? (
              <div className="p-space-lg rounded-xl bg-surface-container-low border border-outline-variant/40 text-center text-outline font-body-sm">
                Belum ada berkas di antrean. Tambahkan berkas di atas untuk mengompresi atau
                mengonversi format.
              </div>
            ) : (
              <div className="flex flex-col gap-space-sm">
                {batchQueue.map((item) => {
                  const pct =
                    item.outputBytes && item.originalBytes
                      ? Math.round((1 - item.outputBytes / item.originalBytes) * 100)
                      : null;
                  return (
                    <div
                      key={item.id}
                      className="bg-surface-container-low p-space-md rounded-lg border border-outline-variant/40 flex items-center justify-between gap-space-md"
                    >
                      <div className="flex items-center gap-space-md min-w-0">
                        <img
                          src={item.src}
                          alt={item.name}
                          className="w-12 h-12 rounded object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-body-md font-medium text-on-surface truncate">
                            {item.name}
                          </div>
                          <div className="font-code-stat text-code-stat text-outline">
                            {item.width}×{item.height} • Asli: {formatFileSize(item.originalBytes)}
                            {item.outputBytes
                              ? ` → Hasil: ${formatFileSize(item.outputBytes)} (${
                                  pct !== null && pct >= 0 ? `-${pct}%` : `+${Math.abs(pct || 0)}%`
                                })`
                              : ''}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-space-xs shrink-0">
                        {item.outputUrl && (
                          <a
                            href={item.outputUrl}
                            download={item.outputName}
                            className="px-space-sm py-1 rounded bg-primary-container text-on-primary-container font-label-sm flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">download</span>
                            <span>Unduh</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setBatchQueue((prev) => prev.filter((x) => x.id !== item.id))
                          }
                          className="w-8 h-8 rounded bg-surface-container hover:text-error flex items-center justify-center"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/40 flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-on-surface">Konfigurasi Konversi</h3>
            <div className="flex flex-col gap-1">
              <label className="font-code-stat text-outline uppercase">Format Output</label>
              <select
                value={targetMime}
                onChange={(e) => setTargetMime(e.target.value as typeof targetMime)}
                className="bg-surface-container p-space-sm rounded text-on-surface border border-outline-variant/40 outline-none"
              >
                <option value="image/webp">WEBP (Ringkas &amp; Modern)</option>
                <option value="image/jpeg">JPG / JPEG</option>
                <option value="image/png">PNG (Lossless)</option>
              </select>
            </div>
            {targetMime !== 'image/png' && (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-label-sm">
                  <span>Kualitas</span>
                  <span className="text-primary font-code-data">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                  className="w-full accent-primary"
                />
              </div>
            )}
            <button
              type="button"
              disabled={batchQueue.length === 0}
              onClick={runBatch}
              className="w-full py-2.5 rounded-full bg-primary-container text-on-primary-container disabled:opacity-40 font-label-md font-semibold"
            >
              Proses Antrean ({batchQueue.length})
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: RESIZER & FLIP */}
      {activeTab === 'resizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin items-start">
          <div className="lg:col-span-4 bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/40 flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-on-surface">Dimensi &amp; Flip</h3>
            <div className="grid grid-cols-2 gap-space-sm">
              <div>
                <label className="font-code-stat text-outline">Lebar (px)</label>
                <input
                  type="number"
                  value={resizeW}
                  onChange={(e) => handleWidthChange(parseInt(e.target.value || '1', 10))}
                  className="w-full mt-1 bg-surface-container px-space-sm py-1.5 rounded text-on-surface border border-outline-variant/40"
                />
              </div>
              <div>
                <label className="font-code-stat text-outline">Tinggi (px)</label>
                <input
                  type="number"
                  value={resizeH}
                  onChange={(e) => handleHeightChange(parseInt(e.target.value || '1', 10))}
                  className="w-full mt-1 bg-surface-container px-space-sm py-1.5 rounded text-on-surface border border-outline-variant/40"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-body-sm cursor-pointer">
              <input
                type="checkbox"
                checked={lockAspect}
                onChange={(e) => setLockAspect(e.target.checked)}
                className="accent-primary"
              />
              <span>Kunci Rasio Aspek</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'HD 1280×720', w: 1280, h: 720 },
                { label: 'FHD 1920×1080', w: 1920, h: 1080 },
                { label: 'Square 1080', w: 1080, h: 1080 },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setLockAspect(false);
                    setResizeW(p.w);
                    setResizeH(p.h);
                  }}
                  className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-high font-code-stat text-code-stat border border-outline-variant/40"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-space-xs">
              <button
                type="button"
                onClick={() => setFlipH((v) => !v)}
                className={`py-2 rounded font-label-sm border ${
                  flipH
                    ? 'bg-primary-container text-on-primary-container border-primary'
                    : 'bg-surface-container text-on-surface border-outline-variant/40'
                }`}
              >
                Flip Horisontal
              </button>
              <button
                type="button"
                onClick={() => setFlipV((v) => !v)}
                className={`py-2 rounded font-label-sm border ${
                  flipV
                    ? 'bg-primary-container text-on-primary-container border-primary'
                    : 'bg-surface-container text-on-surface border-outline-variant/40'
                }`}
              >
                Flip Vertikal
              </button>
            </div>
            <button
              type="button"
              onClick={exportResized}
              className="w-full py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md font-semibold"
            >
              Unduh Hasil ({resizeW}×{resizeH})
            </button>
          </div>
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg border border-outline-variant/40 flex items-center justify-center min-h-[360px]">
            {utilImage ? (
              <img
                src={utilImage.url}
                alt={utilImage.name}
                className="max-h-[400px] object-contain rounded"
                style={{
                  transform: `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                }}
              />
            ) : (
              <span className="text-outline">Pilih gambar terlebih dahulu</span>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: IMAGE TO PDF */}
      {activeTab === 'pdf' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin items-start">
          <div className="lg:col-span-8 flex flex-col gap-space-md">
            <div
              onClick={() => pdfInputRef.current?.click()}
              className="bg-surface-container-lowest rounded-xl p-space-xl border border-dashed border-outline-variant hover:border-primary text-center cursor-pointer"
            >
              <span className="material-symbols-outlined text-[32px] text-primary mb-2">
                picture_as_pdf
              </span>
              <p className="font-headline-sm text-on-surface">
                Pilih satu atau beberapa gambar untuk digabung menjadi PDF
              </p>
              <input
                ref={pdfInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handlePdfUpload(e.target.files);
                }}
              />
            </div>

            {pdfImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
                {pdfImages.map((img, i) => (
                  <div
                    key={img.id}
                    className="relative bg-surface-container-low p-2 rounded-lg border border-outline-variant/40"
                  >
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-28 object-cover rounded"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-code-stat text-[10px] truncate">Hal. {i + 1}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setPdfImages((prev) => prev.filter((item) => item.id !== img.id))
                        }
                        className="text-error text-[12px]"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/40 flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-on-surface">Pengaturan Dokumen PDF</h3>
            <div>
              <label className="font-code-stat text-outline uppercase">Ukuran Halaman</label>
              <select
                value={pdfPageSize}
                onChange={(e) => setPdfPageSize(e.target.value as 'A4' | 'Letter')}
                className="w-full mt-1 bg-surface-container p-2 rounded text-on-surface border border-outline-variant/40"
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="Letter">Letter (8.5 × 11 in)</option>
              </select>
            </div>
            <div>
              <label className="font-code-stat text-outline uppercase">Orientasi</label>
              <select
                value={pdfOrientation}
                onChange={(e) => setPdfOrientation(e.target.value as 'portrait' | 'landscape')}
                className="w-full mt-1 bg-surface-container p-2 rounded text-on-surface border border-outline-variant/40"
              >
                <option value="portrait">Portrait (Tegak)</option>
                <option value="landscape">Landscape (Mendatar)</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between text-label-sm">
                <span>Margin</span>
                <span className="font-code-data text-primary">{pdfMargin} pt</span>
              </div>
              <input
                type="range"
                min={0}
                max={72}
                value={pdfMargin}
                onChange={(e) => setPdfMargin(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </div>
            <button
              type="button"
              disabled={pdfImages.length === 0 || pdfBusy}
              onClick={handleExportPdf}
              className="w-full py-2.5 rounded-full bg-primary-container text-on-primary-container disabled:opacity-40 font-label-md font-semibold"
            >
              {pdfBusy ? 'Membuat PDF...' : `Ekspor PDF (${pdfImages.length} Halaman)`}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: METADATA VIEWER */}
      {activeTab === 'metadata' && (
        <div className="bg-surface-container-low rounded-xl p-space-lg border border-outline-variant/40 grid grid-cols-1 md:grid-cols-2 gap-space-lg">
          <div className="flex items-center justify-center bg-surface-container-lowest rounded-lg p-space-md border border-outline-variant/30">
            {utilImage ? (
              <img
                src={utilImage.url}
                alt={utilImage.name}
                className="max-h-72 object-contain rounded"
              />
            ) : (
              <span className="text-outline">Belum ada gambar</span>
            )}
          </div>
          <div className="flex flex-col gap-space-sm">
            <h3 className="font-headline-sm text-on-surface">Informasi Berkas &amp; Citra</h3>
            {utilImage && (
              <div className="divide-y divide-outline-variant/30 font-code-data text-body-sm">
                <div className="py-2 flex justify-between">
                  <span className="text-outline">Nama Berkas</span>
                  <span className="text-on-surface font-medium">{utilImage.name}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-outline">Tipe MIME</span>
                  <span className="text-on-surface">{utilImage.mimeType}</span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-outline">Ukuran Berkas</span>
                  <span className="text-on-surface">
                    {utilImage.sizeBytes > 0 ? formatFileSize(utilImage.sizeBytes) : 'Sampel URL'}
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-outline">Dimensi Piksel</span>
                  <span className="text-on-surface">
                    {utilImage.width} × {utilImage.height} px
                  </span>
                </div>
                <div className="py-2 flex justify-between">
                  <span className="text-outline">Orientasi</span>
                  <span className="text-on-surface">
                    {utilImage.width >= utilImage.height ? 'Landscape / Square' : 'Portrait'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: COLOR PICKER */}
      {activeTab === 'picker' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin items-start">
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-md border border-outline-variant/40 flex flex-col items-center">
            <p className="font-body-sm text-outline mb-space-sm">
              Klik pada titik mana saja di gambar untuk mengambil nilai warna piksel.
            </p>
            <canvas
              ref={pickerCanvasRef}
              onClick={handleCanvasPick}
              className="max-w-full max-h-[420px] cursor-crosshair rounded border border-outline-variant/40"
            />
          </div>
          <div className="lg:col-span-4 bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/40 flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-on-surface">Hasil Sampel Warna</h3>
            {pickedColor ? (
              <div className="flex flex-col gap-space-sm">
                <div
                  className="w-full h-20 rounded-lg border border-outline-variant/50 shadow-inner"
                  style={{ backgroundColor: pickedColor.hex }}
                />
                {[
                  { label: 'HEX', val: pickedColor.hex },
                  { label: 'RGB', val: pickedColor.rgb },
                  { label: 'HSL', val: pickedColor.hsl },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center justify-between bg-surface-container p-space-sm rounded"
                  >
                    <div>
                      <span className="font-code-stat text-outline block">{c.label}</span>
                      <span className="font-code-data text-on-surface">{c.val}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(c.val);
                        setCopiedHex(true);
                        setTimeout(() => setCopiedHex(false), 1500);
                      }}
                      className="px-2 py-1 rounded bg-surface-container-high text-primary font-code-stat"
                    >
                      Salin
                    </button>
                  </div>
                ))}
                {copiedHex && (
                  <span className="font-code-stat text-secondary">Disalin ke clipboard!</span>
                )}
              </div>
            ) : (
              <p className="font-body-sm text-outline">Belum ada piksel yang dipilih.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: IMAGE SPLITTER */}
      {activeTab === 'splitter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin items-start">
          <div className="lg:col-span-4 bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/40 flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-on-surface">Pemotong Grid Gambar</h3>
            <div className="grid grid-cols-2 gap-space-sm">
              <div>
                <label className="font-code-stat text-outline">Baris (Rows)</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={splitRows}
                  onChange={(e) => setSplitRows(Math.max(1, Math.min(6, Number(e.target.value))))}
                  className="w-full mt-1 bg-surface-container px-space-sm py-1.5 rounded text-on-surface border border-outline-variant/40"
                />
              </div>
              <div>
                <label className="font-code-stat text-outline">Kolom (Cols)</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={splitCols}
                  onChange={(e) => setSplitCols(Math.max(1, Math.min(6, Number(e.target.value))))}
                  className="w-full mt-1 bg-surface-container px-space-sm py-1.5 rounded text-on-surface border border-outline-variant/40"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleSplitImage}
              className="w-full py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md font-semibold"
            >
              Potong Menjadi {splitRows * splitCols} Bagian
            </button>
          </div>

          <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg border border-outline-variant/40">
            {splitTiles.length > 0 ? (
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${splitCols}, minmax(0, 1fr))` }}
              >
                {splitTiles.map((tile) => (
                  <div
                    key={tile.index}
                    className="relative group rounded overflow-hidden border border-outline-variant/40"
                  >
                    <img src={tile.url} alt={`Tile ${tile.index}`} className="w-full h-auto" />
                    <a
                      href={tile.url}
                      download={`split_tile_${tile.index}.png`}
                      className="absolute bottom-1 right-1 px-2 py-0.5 rounded bg-surface-container-lowest/90 text-primary font-code-stat text-[10px]"
                    >
                      Unduh #{tile.index}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-outline py-12 font-body-sm">
                Klik tombol &ldquo;Potong&rdquo; untuk menghasilkan potongan grid yang dapat diunduh
                satu per satu.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-space-md -mx-gutter">
        <SessionCrudBar
          currentTabLabel="Utilitas Cepat"
          currentImageUrl={utilImage?.url}
          currentImageName={utilImage?.name}
          onLoadImage={(img) => {
            setUtilImage({
              name: img.name,
              url: img.url,
              width: img.width || 900,
              height: img.height || 640,
              sizeBytes: img.sizeBytes || 0,
              mimeType: img.mimeType || 'image/png',
            });
            setResizeW(img.width || 900);
            setResizeH(img.height || 640);
          }}
        />
      </div>
    </div>
  );
};
