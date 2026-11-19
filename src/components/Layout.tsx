import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStudio } from '../context/StudioContext';
import { JevalleneLogo } from './JevalleneLogo';

const WORKSPACE_NAV = [
  { to: '/', label: 'Beranda', icon: 'grid_view', end: true },
  { to: '/semua-alat', label: 'Semua Alat', icon: 'apps' },
  { to: '/editor-foto', label: 'Editor Foto', icon: 'photo_camera' },
  { to: '/hapus-latar', label: 'Hapus Latar', icon: 'layers_clear' },
  { to: '/utilitas-cepat', label: 'Utilitas Cepat', icon: 'bolt' },
  { to: '/alat-kreatif', label: 'Alat Kreatif', icon: 'style' },
];

const SYSTEM_NAV = [
  { to: '/proyek-sesi', label: 'Proyek Sesi', icon: 'save_as' },
  { to: '/pengaturan', label: 'Pengaturan', icon: 'tune' },
];

export const Layout: React.FC = () => {
  const { searchQuery, setSearchQuery, recentSearches, addRecentSearch, isDark, toggleTheme } =
    useStudio();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      addRecentSearch(searchQuery);
      setSearchFocused(false);
      navigate('/semua-alat');
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md text-body-md transition-colors duration-200">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-surface-container-low z-40 flex flex-col justify-between border-r border-outline-variant/40 studio-shadow-float transition-all duration-200 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col">
          <div
            className={`h-16 flex items-center bg-surface-container-low border-b border-outline-variant/30 ${
              sidebarCollapsed ? 'px-2 justify-center gap-1' : 'px-gutter justify-between gap-space-sm'
            }`}
          >
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-space-sm shrink-0"
            >
              <JevalleneLogo size={sidebarCollapsed ? 30 : 34} />
              {!sidebarCollapsed && (
                <div className="flex flex-col truncate">
                  <span className="font-headline-sm text-body-lg font-semibold text-on-surface tracking-tight leading-none">
                    Jevallene
                  </span>
                  <span className="font-code-stat text-[10px] text-primary tracking-widest uppercase mt-0.5">
                    Photo Editor
                  </span>
                </div>
              )}
            </Link>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className={`hidden lg:flex rounded hover:bg-surface-container text-outline hover:text-on-surface items-center justify-center shrink-0 ${
                sidebarCollapsed ? 'w-6 h-6' : 'w-7 h-7'
              }`}
              title={sidebarCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>
          </div>

          <nav className="flex flex-col px-gutter-sm space-y-space-2xs pt-space-md">
            {WORKSPACE_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                title={item.label}
                className={({ isActive }) =>
                  `flex items-center ${
                    sidebarCollapsed ? 'justify-center' : 'gap-space-sm'
                  } px-space-sm py-space-xs rounded transition-colors font-label-md text-label-md ${
                    isActive
                      ? 'bg-surface-container-high text-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px] shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-col pb-space-md">
          <nav className="flex flex-col px-gutter-sm space-y-space-2xs">
            {SYSTEM_NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                title={item.label}
                className={({ isActive }) =>
                  `flex items-center ${
                    sidebarCollapsed ? 'justify-center' : 'gap-space-sm'
                  } px-space-sm py-space-xs rounded transition-colors font-label-md text-label-md ${
                    isActive
                      ? 'bg-surface-container-high text-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[18px] shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={
          sidebarCollapsed
            ? 'lg:pl-20 transition-all duration-200'
            : 'lg:pl-64 transition-all duration-200'
        }
      >
        <header
          className={`fixed top-0 left-0 right-0 h-16 bg-surface/90 backdrop-blur-xl z-30 border-b border-outline-variant/40 transition-all duration-200 ${
            sidebarCollapsed ? 'lg:left-20' : 'lg:left-64'
          }`}
        >
          <div className="h-16 w-full px-gutter flex items-center justify-between gap-space-sm">
            <div className="relative flex items-center gap-space-sm flex-1 max-w-lg">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="lg:hidden w-9 h-9 rounded-lg bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface"
                aria-label="Toggle Menu"
              >
                <span className="material-symbols-outlined text-[20px]">menu</span>
              </button>

              <div className="w-full flex items-center gap-space-sm px-space-md py-space-xs bg-surface-container rounded-full border border-outline-variant/50 focus-within:border-primary/60 transition-colors">
                <span className="material-symbols-outlined text-outline text-[18px]">search</span>
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full bg-transparent border-0 outline-none font-body-sm text-body-sm text-on-surface placeholder:text-outline"
                  placeholder="Cari alat atau fitur..."
                  type="text"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-outline hover:text-on-surface flex items-center"
                    aria-label="Bersihkan pencarian"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                ) : (
                  <div className="px-space-xs py-space-2xs bg-surface-container-high rounded font-code-stat text-code-stat text-on-surface-variant leading-none hidden sm:block">
                    ⌘K
                  </div>
                )}
              </div>

              {searchFocused && recentSearches.length > 0 && (
                <div className="absolute top-12 left-0 right-0 bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-xl p-space-sm z-50">
                  <div className="font-code-stat text-code-stat text-outline uppercase px-space-xs pb-space-xs">
                    Pencarian Terkini
                  </div>
                  <div className="flex flex-wrap gap-space-xs">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onMouseDown={() => {
                          setSearchQuery(term);
                          navigate('/semua-alat');
                        }}
                        className="px-space-sm py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-space-sm">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors shadow-sm border border-outline-variant/50"
                title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {isDark ? 'light_mode' : 'dark_mode'}
                </span>
              </button>
            </div>
          </div>
        </header>

        <main className="relative pt-16 bg-surface min-h-screen flex flex-col justify-between">
          <div className="flex-1">
            <Outlet />
          </div>

          <footer className="w-full border-t border-outline-variant/40 bg-surface-container-lowest mt-space-xl pt-space-2xl pb-space-xl px-4 sm:px-6 text-on-surface-variant">
            <div className="w-full flex flex-col gap-space-2xl">
              {/* Brand Intro */}
              <div className="flex items-start gap-space-md max-w-3xl">
                <JevalleneLogo size={36} />
                <p className="text-body-md text-on-surface-variant leading-relaxed">
                  <strong className="text-on-surface font-semibold">Jevallene</strong> — Creative
                  Digital Studio oleh <strong className="text-on-surface">Innssaan</strong>. Bergerak
                  di bidang Web Development, UI/UX Design, Fotografi, dan Videografi.
                </p>
              </div>

              {/* 5-Column Links Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-space-xl text-body-sm">
                <div>
                  <h4 className="font-headline-sm text-body-md font-semibold text-on-surface mb-space-md tracking-tight">
                    Navigasi
                  </h4>
                  <ul className="flex flex-col space-y-space-xs">
                    <li>
                      <a href="https://innssaan.my.id/#hero" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Beranda
                      </a>
                    </li>
                    <li>
                      <a href="https://innssaan.my.id/#tentang" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Tentang Saya
                      </a>
                    </li>
                    <li>
                      <a href="https://innssaan.my.id/#proyek" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Proyek Pilihan
                      </a>
                    </li>
                    <li>
                      <a href="https://innssaan.my.id/#pengalaman" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Pengalaman
                      </a>
                    </li>
                    <li>
                      <a href="https://innssaan.my.id/#kontak" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Kontak
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-headline-sm text-body-md font-semibold text-on-surface mb-space-md tracking-tight">
                    Fokus &amp; Keahlian
                  </h4>
                  <ul className="flex flex-col space-y-space-xs">
                    <li>
                      <a href="https://innssaan.my.id/#proyek" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Web Development
                      </a>
                    </li>
                    <li>
                      <a href="https://innssaan.my.id/#proyek" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        UI/UX Design
                      </a>
                    </li>
                    <li>
                      <a href="https://innssaan.my.id/#pengalaman" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Frontend Architecture
                      </a>
                    </li>
                    <li>
                      <a href="https://innssaan.my.id/#proyek" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Interactive Motion
                      </a>
                    </li>
                    <li>
                      <a href="https://innssaan.my.id/#tentang" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Fotografi &amp; Videografi
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-headline-sm text-body-md font-semibold text-on-surface mb-space-md tracking-tight">
                    Karya &amp; Ruang
                  </h4>
                  <ul className="flex flex-col space-y-space-xs">
                    <li>
                      <a href="https://innssaan.my.id/#proyek" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Arsip Proyek
                      </a>
                    </li>
                    <li>
                      <a href="https://innssaan.my.id/#pengalaman" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Perjalanan Karier
                      </a>
                    </li>
                    <li>
                      <a href="https://open.spotify.com/user/Innssaan_" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Daily Spotify
                      </a>
                    </li>
                    <li>
                      <a href="https://innssaan.my.id/#kontak" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Buku Tamu
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-headline-sm text-body-md font-semibold text-on-surface mb-space-md tracking-tight">
                    Terhubung
                  </h4>
                  <ul className="flex flex-col space-y-space-xs">
                    <li>
                      <a href="https://github.com/Innssaan" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        GitHub
                      </a>
                    </li>
                    <li>
                      <a href="https://www.instagram.com/innssaan_/" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Instagram
                      </a>
                    </li>
                    <li>
                      <a href="https://www.tiktok.com/@sannveerse" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        TikTok
                      </a>
                    </li>
                    <li>
                      <a href="https://open.spotify.com/user/Innssaan_" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Spotify
                      </a>
                    </li>
                    <li>
                      <a href="https://wa.me/628562010605" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        WhatsApp
                      </a>
                    </li>
                    <li>
                      <a href="https://discord.gg/yQnaVA475" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Discord
                      </a>
                    </li>
                    <li>
                      <a href="mailto:rifkitv21@gmail.com" className="hover:text-primary transition-colors">
                        Email
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-headline-sm text-body-md font-semibold text-on-surface mb-space-md tracking-tight">
                    Lokasi &amp; Status
                  </h4>
                  <ul className="flex flex-col space-y-space-xs">
                    <li className="text-on-surface font-medium">Bandung, Indonesia</li>
                    <li>
                      <a
                        href="https://innssaan.my.id/#kontak"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-secondary hover:underline"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                        <span>Tersedia untuk Kolaborasi</span>
                      </a>
                    </li>
                    <li>
                      <a href="https://wa.me/628562010605" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                        Diskusi Proyek
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Collaboration Strip */}
              <div className="p-space-md rounded-xl bg-surface-container-low border border-outline-variant/40 studio-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <p className="text-body-sm text-on-surface-variant">
                  Tertarik mendiskusikan proyek atau peluang kolaborasi? Hubungi langsung via{' '}
                  <a
                    href="https://wa.me/628562010605"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-medium hover:underline"
                  >
                    WhatsApp
                  </a>{' '}
                  atau kirimkan detail kebutuhan melalui{' '}
                  <a
                    href="https://innssaan.my.id/#kontak"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-medium hover:underline"
                  >
                    formulir kontak
                  </a>
                  .
                </p>
              </div>

              {/* Copyright Bar */}
              <div className="pt-space-lg border-t border-outline-variant/40 flex flex-col lg:flex-row items-center justify-between gap-space-md font-code-stat text-code-stat text-outline">
                <span className="text-center lg:text-left">
                  © 2026 Innssaan · JEVALLENE. Seluruh hak cipta dilindungi.
                </span>

                <div className="flex flex-wrap items-center justify-center gap-space-sm">
                  <a href="https://innssaan.my.id/#tentang" target="_blank" rel="noreferrer" className="hover:text-on-surface transition-colors">
                    Tentang
                  </a>
                  <span className="opacity-40">•</span>
                  <a href="https://innssaan.my.id/#proyek" target="_blank" rel="noreferrer" className="hover:text-on-surface transition-colors">
                    Proyek
                  </a>
                  <span className="opacity-40">•</span>
                  <a href="https://innssaan.my.id/#pengalaman" target="_blank" rel="noreferrer" className="hover:text-on-surface transition-colors">
                    Pengalaman
                  </a>
                  <span className="opacity-40">•</span>
                  <a href="https://innssaan.my.id/#kontak" target="_blank" rel="noreferrer" className="hover:text-on-surface transition-colors">
                    Kontak
                  </a>
                </div>

                <div className="flex items-center gap-space-md">
                  <div className="flex items-center gap-space-sm">
                    <a
                      href="https://www.instagram.com/innssaan_/"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                      title="Instagram"
                      className="text-outline hover:text-primary transition-colors flex items-center"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                      </svg>
                    </a>
                    <a
                      href="https://www.tiktok.com/@sannveerse"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="TikTok"
                      title="TikTok"
                      className="text-outline hover:text-primary transition-colors flex items-center"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298 0 .595.048.88.14V9.4a6.33 6.33 0 0 0-.88-.06A6.34 6.34 0 0 0 3 15.68 6.34 6.34 0 0 0 15.68 15.68V8.7a8.16 8.16 0 0 0 4.77 1.52V6.78a4.85 4.85 0 0 1-.86-.09z" />
                      </svg>
                    </a>
                    <a
                      href="https://github.com/Innssaan"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="GitHub"
                      title="GitHub"
                      className="text-outline hover:text-primary transition-colors flex items-center"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                      </svg>
                    </a>
                    <a
                      href="https://discord.gg/yQnaVA475"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Discord"
                      title="Discord"
                      className="text-outline hover:text-primary transition-colors flex items-center"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                    </a>
                  </div>
                  <span className="h-3 w-px bg-outline-variant/60" />
                  <span className="whitespace-nowrap">Bandung, Indonesia</span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
