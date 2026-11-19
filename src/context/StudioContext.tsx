import React, { createContext, useContext, useEffect, useState } from 'react';

export interface StudioProject {
  id: string;
  name: string;
  format: string;
  sizeLabel: string;
  timeAgo: string;
  resolution: string;
  tag: string;
  tagColorClass?: string;
  badgeText?: string;
  badgeIcon?: string;
  imageUrl: string;
  alt: string;
  tab?: string;
}

const DEFAULT_PROJECTS: StudioProject[] = [];

export interface ActiveImage {
  name: string;
  url: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
  sourceTab?: string;
}

interface StudioContextValue {
  activeImage: ActiveImage | null;
  setActiveImage: (img: ActiveImage | null) => void;
  lastProcessed: ActiveImage | null;
  setLastProcessed: (img: ActiveImage | null) => void;
  projects: StudioProject[];
  addProject: (proj: StudioProject) => void;
  updateProject: (id: string, patch: Partial<StudioProject>) => void;
  deleteProject: (id: string) => void;
  clearProjects: () => void;
  resetProjects: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  recentSearches: string[];
  addRecentSearch: (q: string) => void;
  favorites: string[];
  toggleFavorite: (toolTitle: string) => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeImage, setActiveImage] = useState<ActiveImage | null>(null);
  const [lastProcessed, setLastProcessed] = useState<ActiveImage | null>(null);

  const [projects, setProjects] = useState<StudioProject[]>(() => {
    try {
      const saved = localStorage.getItem('jevallene_projects');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_PROJECTS;
  });

  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jevallene_favorites');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['Editor Foto Kanvas', 'Kompresor Berkas', 'Hapus Latar Belakang'];
  });

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('jevallene_searches');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return ['background', 'webp', 'paspor'];
  });

  const [searchQuery, setSearchQuery] = useState('');

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('jevallene_theme');
      if (saved === 'light') return false;
    } catch {
      // ignore
    }
    return true;
  });

  useEffect(() => {
    try {
      localStorage.setItem('jevallene_projects', JSON.stringify(projects));
    } catch {
      // ignore
    }
  }, [projects]);

  useEffect(() => {
    try {
      localStorage.setItem('jevallene_favorites', JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem('jevallene_searches', JSON.stringify(recentSearches));
    } catch {
      // ignore
    }
  }, [recentSearches]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('jevallene_theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  const addProject = (proj: StudioProject) => {
    setProjects((prev) => [proj, ...prev.filter((p) => p.id !== proj.id)]);
  };

  const updateProject = (id: string, patch: Partial<StudioProject>) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const clearProjects = () => setProjects([]);
  const resetProjects = () => setProjects(DEFAULT_PROJECTS);
  const toggleTheme = () => setIsDark((d) => !d);

  const toggleFavorite = (toolTitle: string) => {
    setFavorites((prev) =>
      prev.includes(toolTitle) ? prev.filter((t) => t !== toolTitle) : [toolTitle, ...prev]
    );
  };

  const addRecentSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => [trimmed, ...prev.filter((x) => x !== trimmed)].slice(0, 6));
  };

  return (
    <StudioContext.Provider
      value={{
        activeImage,
        setActiveImage,
        lastProcessed,
        setLastProcessed,
        projects,
        addProject,
        updateProject,
        deleteProject,
        clearProjects,
        resetProjects,
        searchQuery,
        setSearchQuery,
        recentSearches,
        addRecentSearch,
        favorites,
        toggleFavorite,
        isDark,
        toggleTheme,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error('useStudio must be used within StudioProvider');
  return ctx;
}
