import React, { useState } from 'react';
import { type ActiveImage, type StudioProject, useStudio } from '../context/StudioContext';

interface SessionCrudBarProps {
  currentTabLabel: string;
  currentImageUrl?: string;
  currentImageName?: string;
  onLoadImage: (img: ActiveImage) => void;
}

export const SessionCrudBar: React.FC<SessionCrudBarProps> = ({
  currentTabLabel,
  currentImageUrl,
  currentImageName,
  onLoadImage,
}) => {
  const {
    lastProcessed,
    projects,
    addProject,
    updateProject,
    deleteProject,
    clearProjects,
    resetProjects,
  } = useStudio();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleSaveCurrent = () => {
    if (!currentImageUrl) return;
    const name = currentImageName || `Proyek_${currentTabLabel}_${Date.now()}.png`;
    addProject({
      id: `proj-${Date.now()}`,
      name,
      format: (name.split('.').pop() || 'PNG').toUpperCase(),
      sizeLabel: `${currentTabLabel}`,
      timeAgo: 'Baru saja',
      resolution: 'Tersimpan',
      tag: currentTabLabel,
      tagColorClass: 'text-secondary',
      imageUrl: currentImageUrl,
      alt: name,
      tab: currentTabLabel,
    });
  };

  const startEdit = (proj: StudioProject) => {
    setEditingId(proj.id);
    setEditName(proj.name);
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      updateProject(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  const canContinue =
    lastProcessed && lastProcessed.url && lastProcessed.url !== currentImageUrl;

  return (
    <div className="w-full bg-surface-container-low px-gutter py-space-md border-t border-outline-variant/40 flex flex-col gap-space-md">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-sm flex-wrap">
          <span className="font-headline-sm text-body-md text-on-surface font-semibold">
            Proyek Sesi Tersinkron ({projects.length})
          </span>

          {canContinue && (
            <button
              type="button"
              onClick={() => onLoadImage(lastProcessed)}
              className="px-space-sm py-1 rounded-full bg-secondary/15 hover:bg-secondary/25 text-secondary border border-secondary/40 font-label-sm flex items-center gap-1.5 transition-colors studio-shadow"
            >
              <span className="material-symbols-outlined text-[15px]">forward</span>
              <span>
                Lanjutkan dari Proses Sebelumnya ({lastProcessed.sourceTab || lastProcessed.name})
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-space-xs">
          {currentImageUrl && (
            <button
              type="button"
              onClick={handleSaveCurrent}
              className="px-space-sm py-1 rounded bg-primary-container text-on-primary-container font-label-sm font-semibold flex items-center gap-1 studio-shadow"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
              <span>Simpan ke Proyek</span>
            </button>
          )}
          {projects.length > 0 ? (
            <button
              type="button"
              onClick={clearProjects}
              className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-error font-label-sm flex items-center gap-1 border border-outline-variant/40"
            >
              <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
              <span>Bersihkan</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={resetProjects}
              className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-primary font-label-sm flex items-center gap-1 border border-outline-variant/40"
            >
              <span className="material-symbols-outlined text-[15px]">restore</span>
              <span>Muat Contoh</span>
            </button>
          )}
        </div>
      </div>

      {projects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-space-sm">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-surface-container p-space-xs rounded-lg border border-outline-variant/40 studio-shadow flex flex-col gap-1.5"
            >
              <div
                onClick={() =>
                  onLoadImage({ name: proj.name, url: proj.imageUrl, sourceTab: proj.tag })
                }
                className="w-full h-20 rounded overflow-hidden checkerboard-bg flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                title="Klik untuk muat ke tab ini"
              >
                <img
                  src={proj.imageUrl}
                  alt={proj.alt}
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              {editingId === proj.id ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit(proj.id);
                    }}
                    className="w-full bg-surface-container-lowest text-on-surface text-[11px] px-1.5 py-0.5 rounded border border-primary outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(proj.id)}
                    className="text-secondary"
                    title="Simpan"
                  >
                    <span className="material-symbols-outlined text-[15px]">check</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-1">
                  <span className="font-body-sm text-on-surface truncate text-[12px]">
                    {proj.name}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-0.5 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() =>
                    onLoadImage({ name: proj.name, url: proj.imageUrl, sourceTab: proj.tag })
                  }
                  className="font-code-stat text-[10px] text-primary hover:underline"
                >
                  Muat
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(proj)}
                    className="text-outline hover:text-on-surface"
                    title="Ubah Nama"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProject(proj.id)}
                    className="text-outline hover:text-error"
                    title="Hapus"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
