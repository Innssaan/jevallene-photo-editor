import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { type StudioProject, useStudio } from '../context/StudioContext';

export const ProyekSesiPage: React.FC = () => {
  const { projects, setActiveImage, updateProject, deleteProject, clearProjects, resetProjects } =
    useStudio();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const navigate = useNavigate();

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

  return (
    <div className="w-full px-margin md:px-gutter-lg py-space-xl max-w-7xl mx-auto flex flex-col gap-space-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
        <div>
          <span className="font-code-stat text-code-stat text-secondary uppercase tracking-widest">
            Penyimpanan Peramban Tersinkron
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1">
            Proyek Sesi Lokal ({projects.length})
          </h1>
          <p className="font-body-sm text-body-sm text-outline">
            Kelola, ubah nama, atau hapus proyek yang tersinkron di seluruh tab studio.
          </p>
        </div>

        <div className="flex items-center gap-space-sm">
          {projects.length > 0 ? (
            <button
              onClick={clearProjects}
              className="px-space-md py-space-xs rounded bg-surface-container hover:bg-surface-container-high font-label-sm text-label-sm text-error transition-colors flex items-center gap-space-xs border border-outline-variant/40 studio-shadow"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              <span>Bersihkan Semua</span>
            </button>
          ) : (
            <button
              onClick={resetProjects}
              className="px-space-md py-space-xs rounded bg-primary-container text-on-primary-container font-label-sm text-label-sm flex items-center gap-space-xs studio-shadow"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">restore</span>
              <span>Muat Contoh Sesi</span>
            </button>
          )}
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="p-space-2xl rounded-xl bg-surface-container-low border border-outline-variant/40 studio-shadow text-center flex flex-col items-center gap-space-sm">
          <span className="material-symbols-outlined text-[36px] text-outline">folder_off</span>
          <p className="font-body-md text-on-surface-variant">
            Belum ada proyek sesi lokal tersimpan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="bg-surface-container-low rounded-xl overflow-hidden flex flex-col justify-between group studio-shadow border border-outline-variant/40"
            >
              <div className="relative w-full aspect-[4/3] bg-surface-container-lowest overflow-hidden checkerboard-bg flex items-center justify-center">
                <img
                  className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500"
                  alt={proj.alt}
                  src={proj.imageUrl}
                />
                <div className="absolute top-space-sm left-space-sm px-space-xs py-space-2xs rounded bg-surface-container-lowest/85 backdrop-blur font-code-stat text-on-surface border border-outline-variant/40">
                  {proj.sizeLabel}
                </div>
              </div>
              <div className="p-space-md flex flex-col gap-space-sm">
                {editingId === proj.id ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(proj.id);
                      }}
                      className="flex-1 bg-surface-container text-on-surface px-2 py-1 rounded border border-primary outline-none text-body-sm"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => saveEdit(proj.id)}
                      className="px-2 py-1 rounded bg-secondary text-on-secondary text-label-sm font-semibold"
                    >
                      Simpan
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-space-xs">
                    <h4 className="font-headline-sm text-body-lg font-medium text-on-surface truncate">
                      {proj.name}
                    </h4>
                    <span className="font-code-stat text-outline whitespace-nowrap">
                      {proj.timeAgo}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-on-surface-variant font-code-stat pt-space-2xs border-t border-outline-variant/30">
                  <span>Resolusi: {proj.resolution}</span>
                  <span className="text-secondary">{proj.tag}</span>
                </div>

                <div className="flex items-center gap-space-xs pt-space-xs">
                  <button
                    onClick={() => {
                      setActiveImage({ name: proj.name, url: proj.imageUrl });
                      navigate('/editor-foto');
                    }}
                    className="flex-1 py-space-xs rounded bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-sm flex items-center justify-center gap-space-xs border border-outline-variant/40"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px]">edit</span>
                    <span>Buka</span>
                  </button>
                  <button
                    onClick={() => startEdit(proj)}
                    className="px-space-sm py-space-xs rounded bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40"
                    title="Ubah Nama"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px]">drive_file_rename_outline</span>
                  </button>
                  <button
                    onClick={() => deleteProject(proj.id)}
                    className="px-space-sm py-space-xs rounded bg-surface-container hover:bg-error/15 text-error border border-outline-variant/40"
                    title="Hapus Proyek"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete</span>
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
