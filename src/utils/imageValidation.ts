export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/gif',
  'image/tiff',
];

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export interface ValidatedImage {
  file: File;
  url: string;
  width: number;
  height: number;
}

export function validateAndLoadImage(file: File): Promise<ValidatedImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/') && !SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      reject(
        new Error(
          `Format berkas "${file.name}" tidak didukung. Gunakan JPG, PNG, WEBP, BMP, GIF, atau TIFF.`
        )
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      reject(
        new Error(
          `Ukuran berkas "${file.name}" (${(file.size / (1024 * 1024)).toFixed(
            1
          )} MB) melebihi batas maksimum 50 MB.`
        )
      );
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        file,
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Berkas "${file.name}" rusak atau gagal didekode sebagai gambar.`));
    };
    img.src = url;
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
