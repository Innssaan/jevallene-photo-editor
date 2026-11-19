import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmptyFileCard } from '../components/EmptyFileCard';
import { SessionCrudBar } from '../components/SessionCrudBar';
import { useStudio } from '../context/StudioContext';
import { validateAndLoadImage } from '../utils/imageValidation';

type CreativeTab = 'passport' | 'profile' | 'collage' | 'meme' | 'social';

const PASSPORT_PRESETS = [
  { id: '3x4', label: 'Pas Foto 3×4 cm', w: 354, h: 472 },
  { id: '4x6', label: 'Pas Foto 4×6 cm', w: 472, h: 709 },
  { id: '2x2', label: 'US Visa 2×2 inci', w: 600, h: 600 },
  { id: 'passport-id', label: 'Paspor RI (35×45 mm)', w: 413, h: 531 },
];

const SOCIAL_PRESETS = [
  { id: 'ig-post', label: 'Instagram Post (1:1)', w: 1080, h: 1080 },
  { id: 'ig-story', label: 'Instagram Story / Reels (9:16)', w: 1080, h: 1920 },
  { id: 'yt-thumb', label: 'YouTube Thumbnail (16:9)', w: 1280, h: 720 },
  { id: 'x-header', label: 'X / Twitter Header (3:1)', w: 1500, h: 500 },
];

export const AlatKreatifPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { setLastProcessed, addProject } = useStudio();

  const initialTab = (searchParams.get('tab') as CreativeTab) || 'passport';
  const [activeTab, setActiveTab] = useState<CreativeTab>(initialTab);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [sourceName, setSourceName] = useState<string>('Belum ada foto');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = searchParams.get('tab') as CreativeTab | null;
    if (t && ['passport', 'profile', 'collage', 'meme', 'social'].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const switchTab = (tab: CreativeTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleUpload = async (file: File) => {
    setErrorMsg(null);
    try {
      const loaded = await validateAndLoadImage(file);
      setSourceUrl(loaded.url);
      setSourceName(file.name);
      setLastProcessed({
        name: file.name,
        url: loaded.url,
        width: loaded.width,
        height: loaded.height,
        sizeBytes: file.size,
        mimeType: file.type,
        sourceTab: 'Alat Kreatif',
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat gambar.');
    }
  };

  // --- Passport & ID Photo State (Real-Time Auto Remove Background) ---
  const [passportPreset, setPassportPreset] = useState(PASSPORT_PRESETS[0]);
  const [passportBg, setPassportBg] = useState('#d92626');
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);
  const [bgTolerance, setBgTolerance] = useState(32);
  const [passportScale, setPassportScale] = useState(105);
  const [passportOffsetY, setPassportOffsetY] = useState(0);
  const passportCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (activeTab !== 'passport' || !sourceUrl || !passportCanvasRef.current) return;
    const canvas = passportCanvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = passportPreset.w;
      canvas.height = passportPreset.h;

      // 1. Fill official passport background
      ctx.fillStyle = passportBg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Render source portrait onto an offscreen canvas to auto-remove background
      const off = document.createElement('canvas');
      off.width = img.naturalWidth || 900;
      off.height = img.naturalHeight || 640;
      const octx = off.getContext('2d', { willReadFrequently: true });
      if (!octx) return;
      octx.drawImage(img, 0, 0, off.width, off.height);

      if (autoRemoveBg) {
        try {
          const frame = octx.getImageData(0, 0, off.width, off.height);
          const data = frame.data;
          // Auto-sample top-left corner pixel as background color
          const rT = data[0];
          const gT = data[1];
          const bT = data[2];
          const hardDist = bgTolerance * 2.55;
          const softDist = hardDist + 24;

          for (let i = 0; i < data.length; i += 4) {
            const dr = data[i] - rT;
            const dg = data[i + 1] - gT;
            const db = data[i + 2] - bT;
            const dist = Math.sqrt(dr * dr + dg * dg + db * db);
            if (dist <= hardDist) {
              data[i + 3] = 0;
            } else if (dist < softDist) {
              data[i + 3] = Math.round(data[i + 3] * ((dist - hardDist) / (softDist - hardDist)));
            }
          }
          octx.putImageData(frame, 0, 0);
        } catch {
          // If external CORS blocks pixel read, still composite image cleanly
        }
      }

      // 3. Draw cutout portrait centered with zoom & vertical offset
      const coverScale =
        Math.max(canvas.width / off.width, canvas.height / off.height) * (passportScale / 100);
      const dw = off.width * coverScale;
      const dh = off.height * coverScale;
      const dx = (canvas.width - dw) / 2;
      const dy = (canvas.height - dh) / 2 + passportOffsetY;
      ctx.drawImage(off, dx, dy, dw, dh);
    };
    img.src = sourceUrl;
  }, [activeTab, sourceUrl, passportPreset, passportBg, autoRemoveBg, bgTolerance, passportScale, passportOffsetY]);

  const exportPassportCanvas = () => {
    if (!passportCanvasRef.current) return;
    passportCanvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const outName = `pasfoto_${passportPreset.id}.png`;
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
        resolution: `${passportPreset.w} × ${passportPreset.h}`,
        tag: 'Alat Kreatif',
        imageUrl: url,
        alt: outName,
      });
      setLastProcessed({
        name: outName,
        url,
        width: passportPreset.w,
        height: passportPreset.h,
        sizeBytes: blob.size,
        mimeType: 'image/png',
        sourceTab: 'Alat Kreatif',
      });
    }, 'image/png');
  };

  // --- Profile Picture State ---
  const [profileShape, setProfileShape] = useState<'circle' | 'rounded'>('circle');
  const [profileBorderW, setProfileBorderW] = useState(12);
  const [profileBorderColor, setProfileBorderColor] = useState('#ea6944');

  // --- Collage State ---
  const [collageImages, setCollageImages] = useState<string[]>([]);
  const [collageLayout, setCollageLayout] = useState<'cols2' | 'rows2' | 'grid2x2'>('cols2');
  const [collageGap, setCollageGap] = useState(16);
  const [collageBg, setCollageBg] = useState('#ffffff');
  const collageInputRef = useRef<HTMLInputElement>(null);

  // --- Meme State ---
  const [memeTop, setMemeTop] = useState('KETIKA EDIT FOTO');
  const [memeBottom, setMemeBottom] = useState('LANGSUNG JADI');
  const [memeSize, setMemeSize] = useState(44);

  // --- Social State ---
  const [socialPreset, setSocialPreset] = useState(SOCIAL_PRESETS[0]);

  const exportCoverCanvas = (
    targetW: number,
    targetH: number,
    outName: string,
    opts?: {
      bg?: string;
      circle?: boolean;
      rounded?: number;
      borderW?: number;
      borderColor?: string;
      topText?: string;
      bottomText?: string;
      fontSize?: number;
    }
  ) => {
    if (!sourceUrl) {
      setErrorMsg('Silakan unggah foto terlebih dahulu.');
      return;
    }
    setErrorMsg(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (opts?.bg) {
        ctx.fillStyle = opts.bg;
        ctx.fillRect(0, 0, targetW, targetH);
      }

      const bw = opts?.borderW || 0;
      ctx.save();
      if (opts?.circle) {
        ctx.beginPath();
        ctx.arc(targetW / 2, targetH / 2, targetW / 2 - bw, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
      } else if (opts?.rounded) {
        ctx.beginPath();
        ctx.roundRect(bw, bw, targetW - bw * 2, targetH - bw * 2, opts.rounded);
        ctx.clip();
      }

      const scale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      ctx.drawImage(img, (targetW - dw) / 2, (targetH - dh) / 2, dw, dh);
      ctx.restore();

      if (bw > 0 && opts?.borderColor) {
        ctx.strokeStyle = opts.borderColor;
        ctx.lineWidth = bw;
        ctx.beginPath();
        if (opts.circle) {
          ctx.arc(targetW / 2, targetH / 2, targetW / 2 - bw / 2, 0, Math.PI * 2);
        } else {
          ctx.roundRect(bw / 2, bw / 2, targetW - bw, targetH - bw, opts?.rounded || 0);
        }
        ctx.stroke();
      }

      if (opts?.topText || opts?.bottomText) {
        const fs = Math.max(24, Math.round(((opts.fontSize || 44) * targetW) / 800));
        ctx.font = `900 ${fs}px Impact, "Space Grotesk", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(3, Math.round(fs / 10));
        if (opts.topText) {
          ctx.textBaseline = 'top';
          ctx.strokeText(opts.topText, targetW / 2, 24);
          ctx.fillText(opts.topText, targetW / 2, 24);
        }
        if (opts.bottomText) {
          ctx.textBaseline = 'bottom';
          ctx.strokeText(opts.bottomText, targetW / 2, targetH - 24);
          ctx.fillText(opts.bottomText, targetW / 2, targetH - 24);
        }
      }

      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = outName;
        a.click();
      }, 'image/png');
    };
    img.src = sourceUrl;
  };

  const handleCollageUpload = async (files: FileList) => {
    setErrorMsg(null);
    const urls: string[] = [];
    for (const f of Array.from(files).slice(0, 4)) {
      try {
        const loaded = await validateAndLoadImage(f);
        urls.push(loaded.url);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat foto kolase.');
      }
    }
    setCollageImages((prev) => [...prev, ...urls].slice(0, 4));
  };

  const exportCollage = async () => {
    if (collageImages.length < 2) {
      setErrorMsg('Unggah minimal 2 foto untuk membuat kolase.');
      return;
    }
    const loadedImgs = await Promise.all(
      collageImages.map(
        (u) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const im = new Image();
            im.crossOrigin = 'anonymous';
            im.onload = () => resolve(im);
            im.onerror = reject;
            im.src = u;
          })
      )
    );

    const size = 1200;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = collageBg;
    ctx.fillRect(0, 0, size, size);

    const g = collageGap;
    const cells: { x: number; y: number; w: number; h: number }[] = [];

    if (collageLayout === 'cols2') {
      const w = (size - g * 3) / 2;
      const h = size - g * 2;
      cells.push({ x: g, y: g, w, h }, { x: g * 2 + w, y: g, w, h });
    } else if (collageLayout === 'rows2') {
      const w = size - g * 2;
      const h = (size - g * 3) / 2;
      cells.push({ x: g, y: g, w, h }, { x: g, y: g * 2 + h, w, h });
    } else {
      const w = (size - g * 3) / 2;
      const h = (size - g * 3) / 2;
      cells.push(
        { x: g, y: g, w, h },
        { x: g * 2 + w, y: g, w, h },
        { x: g, y: g * 2 + h, w, h },
        { x: g * 2 + w, y: g * 2 + h, w, h }
      );
    }

    cells.forEach((cell, idx) => {
      const im = loadedImgs[idx % loadedImgs.length];
      ctx.save();
      ctx.beginPath();
      ctx.rect(cell.x, cell.y, cell.w, cell.h);
      ctx.clip();
      const sc = Math.max(cell.w / im.naturalWidth, cell.h / im.naturalHeight);
      const dw = im.naturalWidth * sc;
      const dh = im.naturalHeight * sc;
      ctx.drawImage(im, cell.x + (cell.w - dw) / 2, cell.y + (cell.h - dh) / 2, dw, dh);
      ctx.restore();
    });

    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `jevallene_collage_${Date.now()}.png`;
      a.click();
    }, 'image/png');
  };

  return (
    <div className="px-gutter py-margin max-w-7xl mx-auto w-full flex flex-col gap-margin">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            Alat Kreatif &amp; Format Khusus
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Paspor &amp; ID Foto otomatis hapus latar, Foto Profil, Kolase, Meme, dan Social Media
            Resizer.
          </p>
        </div>

        <div>
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
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-space-md py-space-xs rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md flex items-center gap-space-xs studio-shadow"
          >
            <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
            <span>Unggah Foto ({sourceName})</span>
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

      {/* Tabs */}
      <div className="w-full bg-surface-container-low p-1.5 rounded-xl flex flex-wrap gap-1.5 border border-outline-variant/40 studio-shadow">
        {[
          { id: 'passport', icon: 'badge', label: 'Paspor & ID Foto' },
          { id: 'profile', icon: 'account_circle', label: 'Foto Profil' },
          { id: 'collage', icon: 'dashboard', label: 'Kolase Foto' },
          { id: 'meme', icon: 'sentiment_very_satisfied', label: 'Meme Generator' },
          { id: 'social', icon: 'share', label: 'Social Media Resizer' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchTab(t.id as CreativeTab)}
            className={`flex-1 min-w-[140px] px-space-sm py-2 rounded-lg font-body-sm flex items-center justify-center gap-1.5 transition-all ${
              activeTab === t.id
                ? 'bg-primary-container text-on-primary-container studio-shadow font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* PASSPORT (AUTO REMOVE BACKGROUND REAL-TIME) */}
      {activeTab === 'passport' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin items-start">
          <div className="lg:col-span-4 bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/40 studio-shadow flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-on-surface">Paspor &amp; ID Foto Otomatis</h3>

            <div className="flex flex-col gap-1">
              <label className="font-code-stat text-outline uppercase">Ukuran Dokumen</label>
              <select
                value={passportPreset.id}
                onChange={(e) => {
                  const found = PASSPORT_PRESETS.find((p) => p.id === e.target.value);
                  if (found) setPassportPreset(found);
                }}
                className="bg-surface-container p-2 rounded text-on-surface border border-outline-variant/40"
              >
                {PASSPORT_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} ({p.w}×{p.h} px)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between p-space-sm rounded bg-surface-container border border-outline-variant/30">
              <span className="font-body-sm text-on-surface font-medium">
                Auto Hapus Latar Asli
              </span>
              <input
                type="checkbox"
                checked={autoRemoveBg}
                onChange={(e) => setAutoRemoveBg(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>

            {autoRemoveBg && (
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-label-sm">
                  <span className="text-on-surface-variant">Toleransi Hapus Latar</span>
                  <span className="font-code-data text-primary">{bgTolerance}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={80}
                  value={bgTolerance}
                  onChange={(e) => setBgTolerance(parseInt(e.target.value, 10))}
                  className="w-full accent-primary"
                />
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="font-code-stat text-outline uppercase">Warna Latar Resmi</label>
              <div className="flex items-center gap-2">
                {[
                  { color: '#d92626', title: 'Merah' },
                  { color: '#1d4ed8', title: 'Biru' },
                  { color: '#ffffff', title: 'Putih' },
                  { color: '#e5e7eb', title: 'Abu-abu' },
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    title={c.title}
                    onClick={() => setPassportBg(c.color)}
                    style={{ backgroundColor: c.color }}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      passportBg === c.color
                        ? 'border-primary scale-110'
                        : 'border-outline-variant'
                    }`}
                  />
                ))}
                <input
                  type="color"
                  value={passportBg}
                  onChange={(e) => setPassportBg(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-label-sm">
                <span className="text-on-surface-variant">Zoom Subjek</span>
                <span className="font-code-data text-primary">{passportScale}%</span>
              </div>
              <input
                type="range"
                min={60}
                max={160}
                value={passportScale}
                onChange={(e) => setPassportScale(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-label-sm">
                <span className="text-on-surface-variant">Posisi Vertikal</span>
                <span className="font-code-data text-primary">{passportOffsetY}px</span>
              </div>
              <input
                type="range"
                min={-120}
                max={120}
                value={passportOffsetY}
                onChange={(e) => setPassportOffsetY(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </div>

            <button
              type="button"
              onClick={exportPassportCanvas}
              className="w-full py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md font-semibold studio-shadow"
            >
              Ekspor Pas Foto ({passportPreset.w}×{passportPreset.h})
            </button>
          </div>

          <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-xl border border-outline-variant/40 studio-shadow flex items-center justify-center min-h-[420px]">
            {!sourceUrl ? (
              <EmptyFileCard
                subtitle="Tarik dan lepas foto ke sini, atau telusuri penyimpanan lokal Anda untuk membuat Paspor & ID Foto."
                onSelectClick={() => fileInputRef.current?.click()}
                onFileDrop={handleUpload}
              />
            ) : (
              <canvas
                ref={passportCanvasRef}
                className="max-h-[380px] w-auto rounded-lg studio-shadow-float border border-outline-variant/40"
              />
            )}
          </div>
        </div>
      )}

      {/* PROFILE PICTURE */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin items-start">
          <div className="lg:col-span-4 bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/40 studio-shadow flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-on-surface">Profile Picture Maker</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProfileShape('circle')}
                className={`py-2 rounded font-label-sm border ${
                  profileShape === 'circle'
                    ? 'bg-primary-container text-on-primary-container border-primary'
                    : 'bg-surface-container text-on-surface border-outline-variant/40'
                }`}
              >
                Lingkaran
              </button>
              <button
                type="button"
                onClick={() => setProfileShape('rounded')}
                className={`py-2 rounded font-label-sm border ${
                  profileShape === 'rounded'
                    ? 'bg-primary-container text-on-primary-container border-primary'
                    : 'bg-surface-container text-on-surface border-outline-variant/40'
                }`}
              >
                Kotak Melengkung
              </button>
            </div>
            <div>
              <div className="flex justify-between text-label-sm">
                <span>Tebal Bingkai</span>
                <span className="text-primary">{profileBorderW}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={profileBorderW}
                onChange={(e) => setProfileBorderW(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-label-sm">Warna Bingkai</span>
              <input
                type="color"
                value={profileBorderColor}
                onChange={(e) => setProfileBorderColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                exportCoverCanvas(800, 800, `profile_${profileShape}.png`, {
                  circle: profileShape === 'circle',
                  rounded: profileShape === 'rounded' ? 120 : 0,
                  borderW: profileBorderW,
                  borderColor: profileBorderColor,
                })
              }
              className="w-full py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md font-semibold studio-shadow"
            >
              Ekspor Foto Profil (800×800 PNG)
            </button>
          </div>
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-xl border border-outline-variant/40 studio-shadow flex items-center justify-center min-h-[380px] checkerboard-bg">
            {!sourceUrl ? (
              <EmptyFileCard
                subtitle="Tarik dan lepas foto ke sini untuk membuat foto profil."
                onSelectClick={() => fileInputRef.current?.click()}
                onFileDrop={handleUpload}
              />
            ) : (
              <img
                src={sourceUrl}
                alt="Profile preview"
                className="w-64 h-64 object-cover studio-shadow-float"
                style={{
                  borderRadius: profileShape === 'circle' ? '9999px' : '40px',
                  border: `${profileBorderW}px solid ${profileBorderColor}`,
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* COLLAGE */}
      {activeTab === 'collage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin items-start">
          <div className="lg:col-span-4 bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/40 studio-shadow flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-on-surface">Photo Collage Maker</h3>
            <input
              ref={collageInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleCollageUpload(e.target.files);
              }}
            />
            <button
              type="button"
              onClick={() => collageInputRef.current?.click()}
              className="py-2 rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-sm border border-outline-variant/50"
            >
              + Tambah Foto Kolase ({collageImages.length}/4)
            </button>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'cols2', label: '2 Kolom' },
                { id: 'rows2', label: '2 Baris' },
                { id: 'grid2x2', label: 'Grid 2×2' },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setCollageLayout(l.id as typeof collageLayout)}
                  className={`py-1.5 rounded font-code-stat border ${
                    collageLayout === l.id
                      ? 'bg-primary-container text-on-primary-container border-primary'
                      : 'bg-surface-container text-on-surface border-outline-variant/40'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-label-sm">
                <span>Jarak (Spacing)</span>
                <span className="text-primary">{collageGap}px</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                value={collageGap}
                onChange={(e) => setCollageGap(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-label-sm">Warna Latar</span>
              <input
                type="color"
                value={collageBg}
                onChange={(e) => setCollageBg(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
            </div>
            <button
              type="button"
              onClick={exportCollage}
              className="w-full py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md font-semibold studio-shadow"
            >
              Gabung &amp; Unduh Kolase (1200×1200)
            </button>
          </div>
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg border border-outline-variant/40 studio-shadow flex items-center justify-center min-h-[380px]">
            {collageImages.length === 0 ? (
              <span className="text-outline">
                Tambahkan 2–4 foto di panel kiri untuk pratinjau kolase
              </span>
            ) : (
              <div
                className="w-80 h-80 grid overflow-hidden rounded border border-outline-variant/40 studio-shadow-float"
                style={{
                  backgroundColor: collageBg,
                  padding: `${collageGap / 2}px`,
                  gap: `${collageGap / 2}px`,
                  gridTemplateColumns: collageLayout === 'rows2' ? '1fr' : '1fr 1fr',
                  gridTemplateRows: collageLayout === 'cols2' ? '1fr' : '1fr 1fr',
                }}
              >
                {collageImages.map((u, idx) => (
                  <img
                    key={idx}
                    src={u}
                    alt={`Collage ${idx}`}
                    className="w-full h-full object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEME */}
      {activeTab === 'meme' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin items-start">
          <div className="lg:col-span-4 bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/40 studio-shadow flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-on-surface">Meme Generator</h3>
            <input
              type="text"
              value={memeTop}
              onChange={(e) => setMemeTop(e.target.value)}
              placeholder="Teks Atas"
              className="bg-surface-container p-2 rounded text-on-surface border border-outline-variant/40"
            />
            <input
              type="text"
              value={memeBottom}
              onChange={(e) => setMemeBottom(e.target.value)}
              placeholder="Teks Bawah"
              className="bg-surface-container p-2 rounded text-on-surface border border-outline-variant/40"
            />
            <div>
              <div className="flex justify-between text-label-sm">
                <span>Ukuran Teks</span>
                <span className="text-primary">{memeSize}px</span>
              </div>
              <input
                type="range"
                min={20}
                max={80}
                value={memeSize}
                onChange={(e) => setMemeSize(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </div>
            <button
              type="button"
              onClick={() =>
                exportCoverCanvas(1080, 1080, `meme_${Date.now()}.png`, {
                  topText: memeTop,
                  bottomText: memeBottom,
                  fontSize: memeSize,
                })
              }
              className="w-full py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md font-semibold studio-shadow"
            >
              Unduh Meme (1080×1080 PNG)
            </button>
          </div>
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-lg border border-outline-variant/40 studio-shadow flex items-center justify-center min-h-[380px]">
            {!sourceUrl ? (
              <EmptyFileCard
                subtitle="Tarik dan lepas foto ke sini untuk membuat meme."
                onSelectClick={() => fileInputRef.current?.click()}
                onFileDrop={handleUpload}
              />
            ) : (
              <div className="relative w-80 h-80 overflow-hidden rounded studio-shadow-float">
                <img src={sourceUrl} alt="Meme" className="w-full h-full object-cover" />
                <div
                  className="absolute top-3 inset-x-2 text-center font-black uppercase text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.95)]"
                  style={{ fontSize: `${Math.round(memeSize * 0.55)}px` }}
                >
                  {memeTop}
                </div>
                <div
                  className="absolute bottom-3 inset-x-2 text-center font-black uppercase text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.95)]"
                  style={{ fontSize: `${Math.round(memeSize * 0.55)}px` }}
                >
                  {memeBottom}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SOCIAL MEDIA RESIZER */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-margin items-start">
          <div className="lg:col-span-4 bg-surface-container-low p-space-lg rounded-xl border border-outline-variant/40 studio-shadow flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-on-surface">Social Media Resizer</h3>
            <div className="flex flex-col gap-1.5">
              {SOCIAL_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSocialPreset(p)}
                  className={`p-2.5 rounded text-left border flex items-center justify-between ${
                    socialPreset.id === p.id
                      ? 'bg-primary-container text-on-primary-container border-primary font-semibold'
                      : 'bg-surface-container text-on-surface border-outline-variant/40'
                  }`}
                >
                  <span className="text-body-sm">{p.label}</span>
                  <span className="font-code-stat text-[10px]">
                    {p.w}×{p.h}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                exportCoverCanvas(socialPreset.w, socialPreset.h, `social_${socialPreset.id}.png`)
              }
              className="w-full py-2.5 rounded-full bg-primary-container text-on-primary-container font-label-md font-semibold studio-shadow"
            >
              Ekspor ({socialPreset.w}×{socialPreset.h})
            </button>
          </div>
          <div className="lg:col-span-8 bg-surface-container-lowest rounded-xl p-space-xl border border-outline-variant/40 studio-shadow flex items-center justify-center min-h-[380px]">
            {!sourceUrl ? (
              <EmptyFileCard
                subtitle="Tarik dan lepas foto ke sini untuk menyesuaikan ukuran media sosial."
                onSelectClick={() => fileInputRef.current?.click()}
                onFileDrop={handleUpload}
              />
            ) : (
              <div
                className="max-w-md w-full overflow-hidden rounded studio-shadow-float border border-outline-variant/40"
                style={{ aspectRatio: `${socialPreset.w} / ${socialPreset.h}`, maxHeight: '340px' }}
              >
                <img src={sourceUrl} alt="Social preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>
      )}

      <SessionCrudBar
        currentTabLabel="Alat Kreatif"
        currentImageUrl={sourceUrl}
        currentImageName={sourceName}
        onLoadImage={(img) => {
          setSourceUrl(img.url);
          setSourceName(img.name);
        }}
      />
    </div>
  );
};
