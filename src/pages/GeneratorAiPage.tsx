import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudio } from '../context/StudioContext';

const SAMPLE_PROMPTS = [
  'Potret arsitek minimalis di ruang beton brutalist, pencahayaan alami f/1.8, palet terakota dan abu batu netral, tekstur film halus.',
  'Botol parfum kaca amber di atas lempengan marmer travertine basah, pencahayaan studio terarah lembut, pantulan monokromatis elegan.',
  'Lanskap bukit pasir hitam Islandia dengan kabut tipis atmosferik, kontras tinggi minimalis, rasio sinematik.',
  'Bentuk keramik patung avant-garde berwarna terracotta di galeri seni bermeja kayu ek mentah, cahaya jendela sore.',
];

const ASPECT_RATIOS = [
  { ratio: '1:1', short: 'Kotak', desc: '1:1 • Kotak Simetris', cls: 'aspect-square max-w-lg mx-auto' },
  { ratio: '3:2', short: 'Lanskap', desc: '3:2 • Lanskap Editorial', cls: 'aspect-[3/2]' },
  { ratio: '2:3', short: 'Potret', desc: '2:3 • Potret Vertikal', cls: 'aspect-[2/3] max-w-md mx-auto' },
  { ratio: '16:9', short: 'Lebar', desc: '16:9 • Layar Lebar', cls: 'aspect-video' },
  { ratio: '9:16', short: 'Cerita', desc: '9:16 • Cerita Penuh', cls: 'aspect-[9/16] max-w-xs mx-auto' },
];

const STYLES = [
  'Editorial Studio',
  'Sinematik 35mm',
  'Analog Warmth',
  'Render 3D Bersih',
  'Seni Digital',
];

const INITIAL_VARIATIONS = [
  {
    id: 1,
    seed: 83921044,
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAh9y2M0372QRO6m3tUSOo2WVDMN5VWmuPHB04NVf2dqiQ1q0AUsh2IIjB6WBWL1RAt3VTsVYjlxrFYP8qS-BPFOmf10yySWK6ufaGLM5a9BLGRFIZx3ZoA0uX77gerjkOiS15ARa8ssWPEfsz1kKRpmQN3iPqVSZ2ZTeN33pgfuyDPnbLIhJN6QQX-Ubqi748W7qJNAIZMBR7oG2oSF5B6HPLHarcB0pBRMAp2-ix5',
    alt: 'Minimalist brutalist interior',
  },
  {
    id: 2,
    seed: 83921045,
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxvIlfHmi3M0rXZ4Y39TuglDECR22XABOND_YXGVx3P5nt3IK-z28t5kffNC1ujIOMRS5ZkTQjEHPmSGBA4isU7M_oN_iZQF002QSOK-O9FRSZSgde06AaLZuX4vb_By9G6Vrzy_RhED3Mm8pcRRnnTY4qewxtrNf8FTNlm0vwDzQGhyMN2HZ4nLnqmEziKTV4Z1gaanA-cG0b9G0x9GOk60jfmEisLY-1-ZCxGbPJ',
    alt: 'Monolithic stone bench',
  },
  {
    id: 3,
    seed: 83921046,
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDPNJ3oDajHqmf103gNJce9-n-0oofA9P4dlcjqhVTDjfwef3mHsom4M4Ae2RgefroESdaD3SxG7w1Yy8IV3j9xy1xuAkImLL31Pw4fbrcIapq9RZvi99W31GvrN2TsBZZOZxmOBYtk_DOfnGuHABeNXsvcNnsZI7kPDnnRKKjdRRiXC1vOhG7g31MHTWeDtCW1lBEkkWXfENNndgPXPVZ876qleTXi64yrt5EuLfWx',
    alt: 'Minimalist concrete studio space',
  },
  {
    id: 4,
    seed: 83921047,
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAE-ZtGGpN5VistOMU38QXq-IIbJGqwW0R6q-EWb1kMqJU0TgYuz6hEdMVJrGLu0gEfPBdHgokcIhl3unZhDMhOJWuUJVoX5xpqRrqc6tFCvcD2rvnsMGdB4mP7NvdsB9zoEC6PW_mSkKLYXbXcZu0jXXDUIcPZey0uHbv9cK1ouhbhP198zV2--1rfZ7Lo2iTIcQxq5GKRBPUC5yRkwKyF92dN4s6uisKOB4PLUh61',
    alt: 'Architectural concrete staircase',
  },
];

export const GeneratorAiPage: React.FC = () => {
  const { setActiveImage } = useStudio();
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState(SAMPLE_PROMPTS[0]);
  const [negOpen, setNegOpen] = useState(false);
  const [negPrompt, setNegPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[1]);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [cfg, setCfg] = useState(7.0);
  const [variationsCount, setVariationsCount] = useState<1 | 2 | 4>(4);
  const [activeVarIdx, setActiveVarIdx] = useState(0);
  const [seedBase, setSeedBase] = useState(83921044);

  const visibleVariations = INITIAL_VARIATIONS.slice(0, variationsCount);
  const currentVar = visibleVariations[activeVarIdx] || visibleVariations[0];

  const handleRollDice = () => {
    const next = SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)];
    setPrompt(next);
  };

  const handleGenerate = () => {
    setSeedBase(Math.floor(10000000 + Math.random() * 89999999));
    setActiveVarIdx((prev) => (prev + 1) % variationsCount);
  };

  const handleOpenIn = (route: string) => {
    setActiveImage({ name: `ai_gen_${currentVar.seed}.png`, url: currentVar.src });
    navigate(route);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = currentVar.src;
    a.download = `jevallene_ai_${currentVar.seed}.jpg`;
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="flex flex-col w-full">
      <div className="w-full bg-surface-container-low px-gutter py-space-sm flex flex-col md:flex-row md:items-center justify-between gap-space-sm border-b border-outline-variant/40">
        <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
          Generator Gambar AI
        </span>

        <div className="flex items-center gap-space-sm self-end md:self-auto shrink-0">
          <button
            onClick={handleRollDice}
            className="px-space-md py-space-xs rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-md flex items-center gap-space-xs border border-outline-variant/40"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px] text-outline">casino</span>
            <span>Inspirasi Prompt</span>
          </button>
          <button
            onClick={handleGenerate}
            className="px-space-md py-space-xs rounded-full bg-primary-container text-on-primary-container hover:opacity-90 transition-opacity font-label-md flex items-center gap-space-xs shadow-sm font-semibold"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            <span>Hasilkan</span>
          </button>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-12 gap-gutter p-gutter items-start">
        {/* LEFT PANEL */}
        <div className="xl:col-span-5 flex flex-col gap-gutter bg-surface-container-low p-gutter rounded-xl shadow-sm border border-outline-variant/40">
          <div className="flex flex-col gap-space-xs">
            <label className="font-label-md text-on-surface flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px] text-primary">edit_note</span>
              <span>Deskripsi Visual</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-surface-container-lowest text-on-surface p-space-md rounded font-body-md resize-none border border-outline-variant/40 outline-none focus:border-primary"
              rows={4}
            />
          </div>

          <div className="flex flex-col bg-surface-container rounded p-space-sm border border-outline-variant/30">
            <button
              onClick={() => setNegOpen((v) => !v)}
              className="flex items-center justify-between w-full text-left font-label-md text-on-surface-variant hover:text-on-surface"
              type="button"
            >
              <span>Prompt Negatif</span>
              <span
                className={`material-symbols-outlined text-[18px] transition-transform ${
                  negOpen ? 'rotate-180' : ''
                }`}
              >
                expand_more
              </span>
            </button>
            {negOpen && (
              <textarea
                value={negPrompt}
                onChange={(e) => setNegPrompt(e.target.value)}
                className="w-full mt-space-sm bg-surface-container-lowest text-on-surface p-space-sm rounded font-body-sm resize-none border border-outline-variant/30"
                placeholder="Elemen yang dikecualikan..."
                rows={2}
              />
            )}
          </div>

          <div className="flex flex-col gap-space-xs">
            <span className="font-label-md text-on-surface">Rasio Aspek</span>
            <div className="grid grid-cols-5 gap-space-xs">
              {ASPECT_RATIOS.map((item) => {
                const active = item.ratio === selectedRatio.ratio;
                return (
                  <button
                    key={item.ratio}
                    onClick={() => setSelectedRatio(item)}
                    className={`flex flex-col items-center justify-center py-space-xs px-space-2xs rounded-full transition-colors border ${
                      active
                        ? 'bg-primary-container border-primary text-on-primary-container font-semibold'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
                    }`}
                    type="button"
                  >
                    <span className="font-code-stat">{item.ratio}</span>
                    <span className="font-code-stat text-[9px] opacity-80">{item.short}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-space-xs">
            <span className="font-label-md text-on-surface">Gaya Visual</span>
            <div className="flex flex-wrap gap-space-xs">
              {STYLES.map((style) => {
                const active = style === selectedStyle;
                return (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`px-space-sm py-space-2xs rounded-full font-label-sm border transition-colors ${
                      active
                        ? 'bg-primary-container border-primary text-on-primary-container font-semibold'
                        : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                    }`}
                    type="button"
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-space-2xs bg-surface-container p-space-sm rounded border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-on-surface-variant">CFG Scale</span>
                <span className="font-code-data text-primary font-medium">{cfg.toFixed(1)}</span>
              </div>
              <input
                className="w-full accent-primary h-1 bg-surface-container-highest rounded cursor-pointer"
                max={15}
                min={1}
                step={0.5}
                type="range"
                value={cfg}
                onChange={(e) => setCfg(parseFloat(e.target.value))}
              />
            </div>

            <div className="flex flex-col gap-space-2xs bg-surface-container p-space-sm rounded border border-outline-variant/30">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-on-surface-variant">Variasi</span>
                <span className="font-code-data text-on-surface font-medium">
                  {variationsCount} Gambar
                </span>
              </div>
              <div className="grid grid-cols-3 gap-space-2xs h-7 items-center">
                {([1, 2, 4] as const).map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      setVariationsCount(val);
                      if (activeVarIdx >= val) setActiveVarIdx(0);
                    }}
                    className={`h-full rounded-full font-code-stat flex items-center justify-center transition-colors ${
                      variationsCount === val
                        ? 'bg-primary-container text-on-primary-container font-bold'
                        : 'bg-surface-container-high hover:bg-surface-bright text-on-surface'
                    }`}
                    type="button"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full py-space-sm px-space-md rounded-full bg-primary-container hover:opacity-90 text-on-primary-container transition-opacity font-label-md font-semibold flex items-center justify-center gap-space-sm shadow-md"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
            <span>Hasilkan {variationsCount} Gambar</span>
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div className="xl:col-span-7 flex flex-col gap-space-md">
          <div className="relative w-full rounded-xl bg-surface-container-lowest overflow-hidden shadow-xl flex flex-col border border-outline-variant/40">
            <div className="absolute top-space-sm right-space-sm z-20 flex items-center gap-space-xs bg-surface-container-low/90 backdrop-blur-md p-space-2xs rounded shadow-lg">
              <button
                onClick={() => handleOpenIn('/editor-foto')}
                className="px-space-sm py-space-xs rounded-full bg-surface-container text-on-surface hover:bg-primary-container hover:text-on-primary-container transition-colors font-label-sm flex items-center gap-space-2xs"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                <span className="hidden sm:inline">Buka di Editor</span>
              </button>
              <button
                onClick={() => handleOpenIn('/hapus-latar')}
                className="px-space-sm py-space-xs rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-label-sm flex items-center gap-space-2xs"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">layers_clear</span>
                <span className="hidden sm:inline">Hapus Latar</span>
              </button>
              <button
                onClick={handleDownload}
                className="p-space-xs rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors flex items-center justify-center"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
              </button>
            </div>

            <div
              className={`relative w-full ${selectedRatio.cls} bg-surface-container-low flex items-center justify-center overflow-hidden group`}
            >
              <img
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                alt={currentVar.alt}
                src={currentVar.src}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
            {visibleVariations.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setActiveVarIdx(idx)}
                className={`cursor-pointer rounded overflow-hidden shadow-sm transition-all relative border ${
                  activeVarIdx === idx
                    ? 'bg-surface-container-high border-primary'
                    : 'bg-surface-container hover:bg-surface-container-high border-transparent'
                }`}
              >
                <div className="aspect-[3/2] w-full overflow-hidden">
                  <img className="w-full h-full object-cover" alt={item.alt} src={item.src} />
                </div>
                <div className="p-space-xs bg-surface-container-low flex items-center justify-between">
                  <span className="font-code-stat text-on-surface-variant">
                    Seed {seedBase + idx}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
