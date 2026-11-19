import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../components/SkeletonCard';
import { useStudio } from '../context/StudioContext';
import { formatFileSize, validateAndLoadImage } from '../utils/imageValidation';

type ToolCategory = 'all' | 'background' | 'ai' | 'quick' | 'format';

interface EssentialTool {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: Exclude<ToolCategory, 'all'>;
  route: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
}

const ESSENTIAL_TOOLS: EssentialTool[] = [
  {
    id: 'remove-bg',
    title: 'Hapus Latar Belakang',
    description: 'Isolasi latar belakang transparan real-time, ganti warna solid, atau blur latar.',
    icon: 'layers_clear',
    category: 'background',
    route: '/hapus-latar',
    accentBg: 'bg-emerald-500/15',
    accentText: 'text-emerald-500',
    accentBorder: 'hover:border-emerald-500/50',
  },
  {
    id: 'canvas-editor',
    title: 'Editor Foto Kanvas',
    description: 'Crop bebas, rotasi, flip, eksposur, filter studio, teks, watermark, & bingkai.',
    icon: 'tune',
    category: 'quick',
    route: '/editor-foto',
    accentBg: 'bg-primary/15',
    accentText: 'text-primary',
    accentBorder: 'hover:border-primary/50',
  },
  {
    id: 'compressor',
    title: 'Kompresor & Konverter',
    description: 'Kompresi batch, konversi JPG/PNG/WEBP, resizer, splitter, & Image to PDF.',
    icon: 'compress',
    category: 'quick',
    route: '/utilitas-cepat',
    accentBg: 'bg-sky-500/15',
    accentText: 'text-sky-500',
    accentBorder: 'hover:border-sky-500/50',
  },
  {
    id: 'passport-visa',
    title: 'Paspor & ID Biometrik',
    description: 'Auto hapus latar belakang untuk pas foto 3x4, 4x6, US Visa 2x2, & Paspor RI.',
    icon: 'badge',
    category: 'format',
    route: '/alat-kreatif?tab=passport',
    accentBg: 'bg-rose-500/15',
    accentText: 'text-rose-500',
    accentBorder: 'hover:border-rose-500/50',
  },
  {
    id: 'collage-meme',
    title: 'Kolase, Meme & Profil',
    description: 'Gabungkan banyak foto dalam grid kolase, buat meme, atau foto profil bulat.',
    icon: 'dashboard_customize',
    category: 'format',
    route: '/alat-kreatif?tab=collage',
    accentBg: 'bg-amber-500/15',
    accentText: 'text-amber-500',
    accentBorder: 'hover:border-amber-500/50',
  },
  {
    id: 'all-tools',
    title: 'Direktori Semua Alat',
    description: 'Jelajahi seluruh utilitas gambar, konverter, color picker, & image splitter.',
    icon: 'apps',
    category: 'quick',
    route: '/semua-alat',
    accentBg: 'bg-violet-500/15',
    accentText: 'text-violet-500',
    accentBorder: 'hover:border-violet-500/50',
  },
];

export const BerandaPage: React.FC = () => {
  const { setActiveImage, projects, addProject, clearProjects, resetProjects } = useStudio();
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [isLoadingTools, setIsLoadingTools] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsLoadingTools(false), 450);
    return () => clearTimeout(t);
  }, [selectedCategory]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pasteMessage, setPasteMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    try {
      const loaded = await validateAndLoadImage(file);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'IMG';
      setActiveImage({
        name: file.name,
        url: loaded.url,
        width: loaded.width,
        height: loaded.height,
        sizeBytes: file.size,
        mimeType: file.type,
      });
      addProject({
        id: `proj-${Date.now()}`,
        name: file.name,
        format: ext,
        sizeLabel: `${ext} · ${formatFileSize(file.size)}`,
        timeAgo: 'Baru saja',
        resolution: `${loaded.width} × ${loaded.height}`,
        tag: 'Sesi Aktif',
        tagColorClass: 'text-secondary',
        imageUrl: loaded.url,
        alt: file.name,
      });
      navigate('/editor-foto');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal memuat gambar.');
    }
  };

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            handleFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  const handlePasteButton = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], `clipboard-${Date.now()}.png`, { type: imageType });
          handleFile(file);
          return;
        }
      }
      setPasteMessage('Tidak ada gambar di clipboard. Salin gambar lalu tekan Ctrl+V.');
      setTimeout(() => setPasteMessage(null), 3000);
    } catch {
      setPasteMessage('Gunakan Ctrl+V untuk menempel gambar dari clipboard.');
      setTimeout(() => setPasteMessage(null), 3000);
    }
  };

  const filteredTools =
    selectedCategory === 'all'
      ? ESSENTIAL_TOOLS
      : ESSENTIAL_TOOLS.filter((t) => t.category === selectedCategory);

  const handleDownloadProject = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="flex flex-col w-full">
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-64 bg-primary-container/10 blur-[120px] pointer-events-none rounded-full" />

        {/* HERO SECTION */}
        <div className="w-full px-margin md:px-gutter-lg pt-space-xl pb-space-2xl max-w-7xl mx-auto flex flex-col gap-space-xl relative z-10">
          <div className="max-w-3xl flex flex-col gap-space-xs animate-fade-in-up">
            <h1 className="font-headline-xl text-[30px] leading-[38px] sm:text-headline-xl text-on-surface tracking-tight">
              Studio Foto &amp; Alat Gambar{' '}
              <span className="bg-gradient-to-r from-[#E5142A] via-primary to-secondary bg-clip-text text-transparent italic font-light">
                All-in-One.
              </span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed mt-space-2xs">
              Edit, pangkas, hapus latar, kompres, dan olah gambar langsung di peramban Anda.
            </p>
          </div>

          {errorMsg && (
            <div className="p-space-md rounded-xl bg-error/10 border border-error/40 text-error flex items-center justify-between gap-space-sm">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span className="font-body-sm text-body-sm font-medium">{errorMsg}</span>
              </div>
              <button type="button" onClick={() => setErrorMsg(null)}>
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`group relative w-full bg-surface-container-lowest rounded-xl p-space-xl flex flex-col sm:flex-row items-center justify-between gap-space-lg transition-all duration-200 cursor-pointer overflow-hidden shadow-md border ${
              isDragging
                ? 'border-primary bg-surface-container-low scale-[1.01]'
                : 'border-outline-variant/50 hover:border-primary/50 hover:shadow-lg'
            }`}
          >
            <div className="flex items-center gap-space-lg relative z-10">
              <div className="w-14 h-14 rounded-lg bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-primary group-hover:scale-105 group-hover:bg-primary-container group-hover:text-on-primary-container transition-all duration-300 shadow-sm">
                <span className="material-symbols-outlined text-[30px]">add_photo_alternate</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-space-xs flex-wrap">
                  <span className="font-headline-sm text-headline-sm text-on-surface">
                    Tarik &amp; lepas foto ke sini
                  </span>
                  <span className="font-body-sm text-body-sm text-outline">atau</span>
                  <span className="font-label-md text-label-md text-primary cursor-pointer underline underline-offset-4 decoration-primary/40">
                    Pilih Berkas
                  </span>
                  <input
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/bmp,image/gif,image/tiff"
                    className="hidden"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-2xs">
                  JPG, PNG, WEBP, BMP, GIF, TIFF (Maks. 50MB)
                </p>
                {pasteMessage && (
                  <p className="font-code-stat text-code-stat text-primary mt-space-xs">
                    {pasteMessage}
                  </p>
                )}
              </div>
            </div>

            <div
              className="relative z-10 flex items-center gap-space-sm w-full sm:w-auto justify-end"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-space-lg py-space-sm rounded bg-primary-container text-on-primary-container hover:opacity-90 font-label-md text-label-md flex items-center justify-center gap-space-xs transition-all shadow-sm"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">upload</span>
                <span>Buka Gambar Baru</span>
              </button>
              <button
                onClick={handlePasteButton}
                className="p-space-sm rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/50 transition-all shadow-sm"
                title="Tempel dari Clipboard (Ctrl+V)"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">content_paste</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TOOLS SECTION (Global Theme Colors) */}
      <div className="w-full px-margin md:px-gutter-lg pb-space-2xl max-w-7xl mx-auto flex flex-col gap-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pt-space-xs">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
              Katalog Alat Utama
            </h2>
          </div>

          <div className="flex items-center gap-space-xs overflow-x-auto pb-space-2xs sm:pb-0">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'background', label: 'Latar Belakang' },
              { id: 'quick', label: 'Editor & Utilitas' },
              { id: 'format', label: 'Kreatif & Dokumen' },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => {
                  setIsLoadingTools(true);
                  setSelectedCategory(pill.id as ToolCategory);
                }}
                className={`px-space-md py-space-xs rounded-full font-label-sm text-label-sm whitespace-nowrap transition-all ${
                  selectedCategory === pill.id
                    ? 'bg-primary-container text-on-primary-container shadow-sm font-semibold'
                    : 'bg-surface-container text-on-surface-variant border border-outline-variant/40 hover:text-on-surface'
                }`}
                type="button"
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {isLoadingTools
            ? Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={idx} />)
            : filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  onClick={() => navigate(tool.route)}
                  className={`group cursor-pointer bg-surface-container-low hover:bg-surface-container rounded-xl p-space-lg flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 studio-shadow hover:studio-shadow-float border border-outline-variant/40 ${tool.accentBorder}`}
                >
                  <div className="flex flex-col gap-space-md min-w-0">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-10 h-10 rounded-lg border border-outline-variant/30 flex items-center justify-center ${tool.accentBg} ${tool.accentText} transition-transform group-hover:scale-105`}
                      >
                        <span className="material-symbols-outlined text-[22px]">{tool.icon}</span>
                      </div>
                      <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-colors">
                        arrow_forward
                      </span>
                    </div>
                    <div className="flex flex-col gap-space-2xs min-w-0">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors truncate">
                        {tool.title}
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed line-clamp-2">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate('/semua-alat')}
            className="font-label-md text-label-md text-primary hover:underline flex items-center gap-space-xs"
          >
            <span>Lihat semua alat</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* RECENT LOCAL SESSION PROJECTS */}
      <div className="w-full px-margin md:px-gutter-lg pb-space-2xl max-w-7xl mx-auto flex flex-col gap-space-lg">
        <div className="flex items-center justify-between">
          <h2 className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
            Proyek Sesi Terkini
          </h2>
          {projects.length > 0 ? (
            <button
              onClick={clearProjects}
              className="px-space-sm py-space-2xs rounded bg-surface-container hover:bg-surface-container-high font-label-sm text-on-surface transition-colors flex items-center gap-space-2xs border border-outline-variant/40"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              <span>Bersihkan</span>
            </button>
          ) : (
            <button
              onClick={resetProjects}
              className="px-space-sm py-space-2xs rounded bg-surface-container hover:bg-surface-container-high font-label-sm text-primary transition-colors flex items-center gap-space-2xs border border-outline-variant/40"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">restore</span>
              <span>Muat Contoh</span>
            </button>
          )}
        </div>

        {projects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
            {projects.slice(0, 6).map((proj) => (
              <div
                key={proj.id}
                className="bg-surface-container-low rounded-xl overflow-hidden flex flex-col justify-between group shadow-md border border-outline-variant/40"
              >
                <div className="relative w-full aspect-[4/3] bg-surface-container-lowest overflow-hidden">
                  <img
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    alt={proj.alt}
                    src={proj.imageUrl}
                  />
                  <div className="absolute top-space-sm left-space-sm px-space-xs py-space-2xs rounded bg-surface-container-lowest/85 backdrop-blur font-code-stat text-on-surface border border-outline-variant/40">
                    {proj.sizeLabel}
                  </div>
                </div>

                <div className="p-space-md flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between gap-space-xs">
                    <h4 className="font-headline-sm text-body-lg font-medium text-on-surface truncate">
                      {proj.name}
                    </h4>
                    <span className="font-code-stat text-outline whitespace-nowrap">
                      {proj.timeAgo}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-space-xs pt-space-xs">
                    <button
                      onClick={() => {
                        setActiveImage({ name: proj.name, url: proj.imageUrl });
                        navigate('/editor-foto');
                      }}
                      className="px-space-sm py-space-xs rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-sm flex items-center justify-center gap-space-2xs border border-outline-variant/50"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDownloadProject(proj.imageUrl, proj.name)}
                      className="px-space-sm py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm flex items-center justify-center gap-space-2xs border border-outline-variant/40"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      <span>Unduh</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
