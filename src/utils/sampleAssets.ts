/**
 * Built-in CORS-free SVG Data URI sample images so real-time Canvas pixel processing
 * (Remove Background, Color Picker, Export) works immediately without CORS tainting.
 */
function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_STUDIO_PRODUCT = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="640" viewBox="0 0 900 640">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e8e2d9"/>
      <stop offset="100%" stop-color="#dcd4c8"/>
    </linearGradient>
    <linearGradient id="bottle" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#c24b28"/>
      <stop offset="50%" stop-color="#ea6944"/>
      <stop offset="100%" stop-color="#8c2d13"/>
    </linearGradient>
  </defs>
  <rect width="900" height="640" fill="url(#bg)"/>
  <ellipse cx="450" cy="525" rx="140" ry="22" fill="#b8afa2" opacity="0.55"/>
  <rect x="360" y="210" width="180" height="300" rx="28" fill="url(#bottle)"/>
  <rect x="395" y="135" width="110" height="80" rx="10" fill="#232220"/>
  <rect x="415" y="110" width="70" height="30" rx="6" fill="#3a3835"/>
  <rect x="385" y="290" width="130" height="120" rx="10" fill="#f7f5f2"/>
  <text x="450" y="345" font-family="sans-serif" font-size="22" font-weight="700" fill="#1b1a18" text-anchor="middle">JEVALLENE</text>
  <text x="450" y="375" font-family="sans-serif" font-size="13" fill="#77716a" text-anchor="middle">STUDIO SERUM</text>
</svg>
`);

export const SAMPLE_STUDIO_PORTRAIT = svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="640" viewBox="0 0 900 640">
  <rect width="900" height="640" fill="#e6ecf0"/>
  <path d="M270 640 C270 460 340 410 450 410 C560 410 630 460 630 640 Z" fill="#202020"/>
  <rect x="412" y="330" width="76" height="100" rx="30" fill="#d99b7e"/>
  <ellipse cx="450" cy="245" rx="95" ry="118" fill="#e6ac8f"/>
  <path d="M352 230 C350 135 410 100 460 105 C530 105 555 160 548 235 C535 180 495 160 450 165 C405 160 370 185 352 230 Z" fill="#1b1a18"/>
  <circle cx="415" cy="245" r="9" fill="#1b1a18"/>
  <circle cx="485" cy="245" r="9" fill="#1b1a18"/>
  <path d="M425 298 Q450 315 475 298" stroke="#9e5a44" stroke-width="5" fill="none" stroke-linecap="round"/>
</svg>
`);
