import React, { useState } from 'react';

interface EmptyFileCardProps {
  subtitle?: string;
  onSelectClick: () => void;
  onFileDrop?: (file: File) => void;
}

export const EmptyFileCard: React.FC<EmptyFileCardProps> = ({
  subtitle = 'Tarik dan lepas berkas foto ke sini, atau telusuri penyimpanan lokal Anda untuk memulai.',
  onSelectClick,
  onFileDrop,
}) => {
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f && onFileDrop) onFileDrop(f);
      }}
      className={`w-full max-w-md rounded-xl bg-surface-container-low border p-space-xl flex flex-col items-center text-center gap-space-md studio-shadow transition-colors ${
        dragging ? 'border-primary bg-surface-container' : 'border-outline-variant/40'
      }`}
    >
      <div className="w-14 h-14 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-primary studio-shadow">
        <span className="material-symbols-outlined text-[28px]">add_photo_alternate</span>
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="font-headline-sm text-headline-lg text-on-surface font-semibold tracking-tight">
          Belum Ada Berkas yang Dimuat
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onSelectClick}
        className="w-full max-w-xs py-2.5 px-space-lg rounded-lg bg-primary-container hover:opacity-90 text-on-primary-container font-label-md font-semibold flex items-center justify-center gap-2 studio-shadow transition-opacity"
      >
        <span className="material-symbols-outlined text-[18px]">upload_file</span>
        <span>+ Pilih &amp; Impor Berkas Foto</span>
      </button>

      <div className="flex flex-col items-center gap-2 pt-space-xs">
        <span className="font-code-stat text-[10px] text-outline uppercase tracking-wider">
          Format Berkas yang Didukung
        </span>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {['PNG', 'JPEG', 'WebP', 'TIFF'].map((fmt) => (
            <span
              key={fmt}
              className="px-3 py-1 rounded-full bg-surface-container border border-outline-variant/40 font-code-stat text-[11px] text-on-surface-variant"
            >
              {fmt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
