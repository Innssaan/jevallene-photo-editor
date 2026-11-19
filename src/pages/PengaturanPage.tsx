import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';

export const PengaturanPage: React.FC = () => {
  const { isDark, toggleTheme } = useStudio();
  const [webGpu, setWebGpu] = useState(true);
  const [preserveExif, setPreserveExif] = useState(true);
  const [colorProfile, setColorProfile] = useState('ProPhoto RGB');

  return (
    <div className="w-full px-margin md:px-gutter-lg py-space-xl max-w-4xl mx-auto flex flex-col gap-space-lg">
      <div>
        <span className="font-code-stat text-code-stat text-primary uppercase tracking-widest">
          Preferensi Sistem
        </span>
        <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mt-1">
          Pengaturan Studio Core
        </h1>
        <p className="font-body-sm text-body-sm text-outline">
          Konfigurasi akselerasi perangkat keras, profil warna, dan preferensi sesi lokal.
        </p>
      </div>

      <div className="bg-surface-container-low rounded-xl p-space-lg border border-surface-container-high flex flex-col gap-space-lg">
        <div className="flex items-center justify-between pb-space-md border-b border-surface-container-high">
          <div className="flex flex-col">
            <span className="font-label-md text-on-surface">Tema Antarmuka Studio</span>
            <span className="font-body-sm text-outline">
              Mode gelap terkalibrasi untuk akurasi penilaian warna
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className="px-space-md py-space-xs rounded-full bg-surface-container-high text-on-surface font-label-sm flex items-center gap-space-xs border border-outline-variant/40"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isDark ? 'dark_mode' : 'light_mode'}
            </span>
            <span>{isDark ? 'Mode Gelap' : 'Mode Terang'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between pb-space-md border-b border-surface-container-high">
          <div className="flex flex-col">
            <span className="font-label-md text-on-surface">Akselerasi GPU WebGPU / WebGL2</span>
            <span className="font-body-sm text-outline">
              Gunakan shader GPU lokal untuk pratinjau filter real-time 60 FPS
            </span>
          </div>
          <input
            type="checkbox"
            checked={webGpu}
            onChange={(e) => setWebGpu(e.target.checked)}
            className="w-5 h-5 accent-primary cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between pb-space-md border-b border-surface-container-high">
          <div className="flex flex-col">
            <span className="font-label-md text-on-surface">Pertahankan Metadata EXIF &amp; C2PA</span>
            <span className="font-body-sm text-outline">
              Simpan informasi kamera dan hak cipta saat mengekspor dari Editor Foto
            </span>
          </div>
          <input
            type="checkbox"
            checked={preserveExif}
            onChange={(e) => setPreserveExif(e.target.checked)}
            className="w-5 h-5 accent-primary cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-md text-on-surface">Profil Ruang Warna Kerja</span>
            <span className="font-body-sm text-outline">
              Ruang warna default untuk kanvas pengolahan RAW
            </span>
          </div>
          <select
            value={colorProfile}
            onChange={(e) => setColorProfile(e.target.value)}
            className="bg-surface-container px-space-md py-space-xs rounded text-on-surface font-code-data text-code-data border border-surface-container-highest outline-none"
          >
            <option value="ProPhoto RGB">ProPhoto RGB (16-Bit)</option>
            <option value="Adobe RGB">Adobe RGB (1998)</option>
            <option value="sRGB">sRGB IEC61966-2.1</option>
          </select>
        </div>
      </div>
    </div>
  );
};
