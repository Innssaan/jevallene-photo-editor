export interface PdfPageInput {
  imageUrl: string;
  name: string;
}

export interface PdfOptions {
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  marginPt: number;
}

function loadJpegBytes(
  url: string
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Gagal membuat konteks Canvas untuk PDF.'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error('Gagal mengonversi gambar ke JPEG untuk PDF.'));
            return;
          }
          const buf = await blob.arrayBuffer();
          resolve({
            bytes: new Uint8Array(buf),
            width: canvas.width,
            height: canvas.height,
          });
        },
        'image/jpeg',
        0.92
      );
    };
    img.onerror = () => reject(new Error('Gagal memuat gambar untuk ekspor PDF.'));
    img.src = url;
  });
}

/**
 * Generates a valid multi-page PDF 1.4 Blob containing JPEG XObjects purely client-side.
 */
export async function generatePdfFromImages(
  images: PdfPageInput[],
  options: PdfOptions
): Promise<Blob> {
  if (images.length === 0) {
    throw new Error('Tidak ada gambar untuk diekspor ke PDF.');
  }

  const baseW = options.pageSize === 'A4' ? 595.28 : 612;
  const baseH = options.pageSize === 'A4' ? 841.89 : 792;
  const pageW = options.orientation === 'portrait' ? baseW : baseH;
  const pageH = options.orientation === 'portrait' ? baseH : baseW;

  const loaded = await Promise.all(images.map((item) => loadJpegBytes(item.imageUrl)));

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0]; // 1-indexed object offsets
  let cursor = 0;

  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    cursor += b.length;
  };
  const pushStr = (s: string) => pushBytes(encoder.encode(s));

  pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // Object 1: Catalog, Object 2: Pages
  const pageObjIds: number[] = [];
  let nextObjId = 3;

  // Reserve slots: for each page we have 3 objects: Page, Content stream, Image XObject
  const pageEntries = loaded.map((imgData) => {
    const pageId = nextObjId++;
    const contentId = nextObjId++;
    const imgId = nextObjId++;
    pageObjIds.push(pageId);
    return { pageId, contentId, imgId, imgData };
  });

  // Obj 1: Catalog
  offsets[1] = cursor;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages
  offsets[2] = cursor;
  pushStr(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjIds.length} >>\nendobj\n`
  );

  for (const entry of pageEntries) {
    const availW = Math.max(20, pageW - options.marginPt * 2);
    const availH = Math.max(20, pageH - options.marginPt * 2);
    const scale = Math.min(availW / entry.imgData.width, availH / entry.imgData.height);
    const drawW = entry.imgData.width * scale;
    const drawH = entry.imgData.height * scale;
    const x = (pageW - drawW) / 2;
    const y = (pageH - drawH) / 2;

    const streamCmd = `q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ\n`;
    const streamBytes = encoder.encode(streamCmd);

    // Page object
    offsets[entry.pageId] = cursor;
    pushStr(
      `${entry.pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Resources << /XObject << /Im0 ${entry.imgId} 0 R >> >> /Contents ${entry.contentId} 0 R >>\nendobj\n`
    );

    // Content stream object
    offsets[entry.contentId] = cursor;
    pushStr(
      `${entry.contentId} 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`
    );
    pushBytes(streamBytes);
    pushStr('\nendstream\nendobj\n');

    // Image XObject
    offsets[entry.imgId] = cursor;
    pushStr(
      `${entry.imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${entry.imgData.width} /Height ${entry.imgData.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${entry.imgData.bytes.length} >>\nstream\n`
    );
    pushBytes(entry.imgData.bytes);
    pushStr('\nendstream\nendobj\n');
  }

  const xrefOffset = cursor;
  pushStr(`xref\n0 ${nextObjId}\n0000000000 65535 f \n`);
  for (let i = 1; i < nextObjId; i++) {
    pushStr(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size ${nextObjId} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}
