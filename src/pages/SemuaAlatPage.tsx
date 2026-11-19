import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudio } from '../context/StudioContext';
import toolSectionsData from '../data/allTools.json';

interface ToolCardItem {
  title: string;
  description: string;
  icon: string;
  badge: string;
  footer: string;
  keywords: string;
}

interface ToolSection {
  category: string;
  title: string;
  tools: ToolCardItem[];
}

const TOOL_SECTIONS = toolSectionsData as ToolSection[];

function getRouteForTool(category: string, title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('paspor') || lower.includes('id')) return '/alat-kreatif?tab=passport';
  if (lower.includes('profil')) return '/alat-kreatif?tab=profile';
  if (lower.includes('kolase') || lower.includes('collage')) return '/alat-kreatif?tab=collage';
  if (lower.includes('meme')) return '/alat-kreatif?tab=meme';
  if (lower.includes('sosial') || lower.includes('social')) return '/alat-kreatif?tab=social';
  if (lower.includes('pdf')) return '/utilitas-cepat?tab=pdf';
  if (lower.includes('metadata') || lower.includes('exif')) return '/utilitas-cepat?tab=metadata';
  if (lower.includes('warna') || lower.includes('picker')) return '/utilitas-cepat?tab=picker';
  if (lower.includes('split') || lower.includes('potong grid')) return '/utilitas-cepat?tab=splitter';
  if (lower.includes('ukuran') || lower.includes('resize') || lower.includes('flip'))
    return '/utilitas-cepat?tab=resizer';

  const map: Record<string, string> = {
    latar: '/hapus-latar',
    editor: '/editor-foto',
    ai: '/generator-ai',
    kreatif: '/alat-kreatif',
    utilitas: '/utilitas-cepat',
  };
  return map[category] || '/editor-foto';
}

const CATEGORY_FILTERS = [
  { id: 'all', label: 'Semua' },
  { id: 'latar', label: 'Latar Belakang' },
  { id: 'editor', label: 'Editor Foto' },
  { id: 'ai', label: 'AI Gambar' },
  { id: 'kreatif', label: 'Kreatif & E-Commerce' },
  { id: 'utilitas', label: 'Utilitas Gambar' },
];

export const SemuaAlatPage: React.FC = () => {
  const { searchQuery, setSearchQuery, favorites, toggleFavorite } = useStudio();
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  const totalTools = useMemo(
    () => TOOL_SECTIONS.reduce((acc, s) => acc + s.tools.length, 0),
    []
  );

  const filteredSections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TOOL_SECTIONS.filter((sec) => activeFilter === 'all' || sec.category === activeFilter)
      .map((sec) => ({
        ...sec,
        tools: sec.tools.filter((t) => {
          if (!q) return true;
          return (
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.keywords.toLowerCase().includes(q)
          );
        }),
      }))
      .filter((sec) => sec.tools.length > 0);
  }, [activeFilter, searchQuery]);

  return (
    <div className="flex flex-col w-full">
      <section className="w-full px-gutter-lg py-space-xl bg-surface-container-lowest border-b border-outline-variant/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="font-code-stat text-code-stat tracking-widest text-primary uppercase">
                Katalog Presisi
              </span>
              <span className="w-1 h-1 rounded-full bg-outline" />
              <span className="font-code-stat text-code-stat text-secondary uppercase">
                {totalTools} Modul Alat
              </span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
              Direktori Semua Alat Kreatif
            </h1>
            <p className="font-body-md text-body-md text-outline max-w-2xl">
              Temukan semua alat pengeditan foto, utilitas gambar, alat kreatif, dan modul AI dalam
              satu direktori tanpa login.
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-16 z-20 w-full px-gutter-lg py-space-md bg-surface/95 backdrop-blur-md shadow-sm border-b border-outline-variant/40">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
          <div className="relative flex-1 max-w-xl">
            <div className="absolute inset-y-0 left-0 pl-space-md flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low text-on-surface placeholder:text-outline font-body-sm pl-10 pr-10 py-space-sm rounded-full border border-outline-variant/50 outline-none focus:bg-surface-container transition-all"
              placeholder="Ketik nama alat, misal: background, webp, pdf, paspor..."
              type="text"
            />
          </div>

          <div className="flex items-center gap-space-xs overflow-x-auto pb-space-2xs lg:pb-0">
            {CATEGORY_FILTERS.map((cat) => {
              const count =
                cat.id === 'all'
                  ? totalTools
                  : TOOL_SECTIONS.find((s) => s.category === cat.id)?.tools.length || 0;
              const active = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`px-space-md py-space-2xs rounded-full font-label-sm whitespace-nowrap transition-colors flex items-center gap-space-xs ${
                    active
                      ? 'bg-primary-container text-on-primary-container shadow-sm font-semibold'
                      : 'bg-surface-container text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
                  }`}
                  type="button"
                >
                  <span>{cat.label}</span>
                  <span className="font-code-stat opacity-80">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-gutter-lg py-space-xl flex flex-col gap-space-2xl">
        {filteredSections.length === 0 ? (
          <div className="p-space-xl rounded-xl bg-surface-container-low border border-outline-variant/40 text-center text-on-surface-variant">
            Tidak ada alat yang cocok dengan pencarian &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          filteredSections.map((sec) => (
            <section key={sec.category} className="flex flex-col gap-space-md">
              <div className="flex items-center gap-space-sm pb-space-xs">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <h2 className="font-headline-sm text-headline-sm text-on-surface">{sec.title}</h2>
                <span className="font-code-stat text-code-stat text-outline px-space-xs py-space-2xs bg-surface-container rounded uppercase">
                  {sec.tools.length} Modul
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
                {sec.tools.map((tool) => {
                  const isFav = favorites.includes(tool.title);
                  return (
                    <article
                      key={tool.title}
                      className="group bg-surface-container-low hover:bg-surface-container transition-all p-space-md rounded flex flex-col justify-between shadow-sm border border-outline-variant/40 hover:border-primary/40"
                    >
                      <div className="flex flex-col gap-space-sm">
                        <div className="flex items-center justify-between">
                          <div className="w-9 h-9 rounded bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                            <span className="material-symbols-outlined text-[20px]">
                              {tool.icon}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleFavorite(tool.title)}
                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                              isFav ? 'text-amber-400' : 'text-outline hover:text-on-surface'
                            }`}
                            title={isFav ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              {isFav ? 'star' : 'star_outline'}
                            </span>
                          </button>
                        </div>
                        <div>
                          <h3 className="font-label-md text-label-md text-on-surface font-semibold group-hover:text-primary transition-colors">
                            {tool.title}
                          </h3>
                          <p className="font-body-sm text-body-sm text-outline mt-space-2xs line-clamp-2">
                            {tool.description}
                          </p>
                        </div>
                      </div>

                      <div className="pt-space-md flex items-center justify-between">
                        <span className="font-code-stat text-code-stat text-outline">
                          {sec.category === 'ai' ? 'Menunggu Provider AI' : tool.footer}
                        </span>
                        <button
                          onClick={() => navigate(getRouteForTool(sec.category, tool.title))}
                          className="px-space-sm py-space-2xs bg-surface-container-high group-hover:bg-primary-container text-on-surface group-hover:text-on-primary-container font-label-sm text-label-sm rounded flex items-center gap-space-2xs transition-colors"
                          type="button"
                        >
                          <span>Luncurkan</span>
                          <span className="material-symbols-outlined text-[14px]">
                            arrow_forward
                          </span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
};
