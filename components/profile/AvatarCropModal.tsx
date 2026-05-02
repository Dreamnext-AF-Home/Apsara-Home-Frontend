'use client';

import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { AnimatePresence, motion } from 'framer-motion';

/* --- Canvas helper: crop image to blob --- */
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    pixelCrop.width, pixelCrop.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => { if (blob) resolve(blob); else reject(new Error('Canvas toBlob failed')); },
      'image/jpeg', 0.92,
    );
  });
}

/* --- Props --- */
type AvatarCropModalProps = {
  src: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
};

export default function AvatarCropModal({ src, onConfirm, onCancel }: AvatarCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    createImage(src)
      .then((image) => {
        if (cancelled) return;
        setImageSize({ width: image.naturalWidth || image.width, height: image.naturalHeight || image.height });
      })
      .catch(() => {
        if (!cancelled) setImageSize(null);
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const blob = await getCroppedBlob(src, croppedAreaPixels);
      onConfirm(blob);
    } catch {
      onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  const imageAspect = imageSize && imageSize.height > 0 ? imageSize.width / imageSize.height : 1;
  const isPortrait = imageAspect < 0.9;
  const isLandscape = imageAspect > 1.15;
  const cropViewportClass = isPortrait
    ? 'relative h-[min(64vh,34rem)] max-h-[64vh] overflow-hidden bg-slate-950'
    : isLandscape
      ? 'relative w-[min(82vw,38rem)] overflow-hidden bg-slate-950'
      : 'relative aspect-square w-[min(82vw,32rem)] overflow-hidden bg-slate-950';
  const cropViewportStyle = isPortrait || isLandscape
    ? { aspectRatio: `${imageSize?.width ?? 1} / ${imageSize?.height ?? 1}` }
    : undefined;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onCancel}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="w-fit max-w-[92vw] overflow-hidden rounded-3xl bg-white dark:bg-gray-900 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Crop Photo</p>
              <p className="text-[11px] text-slate-400 dark:text-gray-500">Drag to reposition · scroll to zoom</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Cancel"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Crop area */}
          <div className="mx-auto flex w-fit justify-center bg-slate-950">
            <div className={cropViewportClass} style={cropViewportStyle}>
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                minZoom={1}
                maxZoom={4}
                aspect={1}
                cropShape="round"
                objectFit="cover"
                showGrid={false}
                restrictPosition
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: { borderRadius: 0 },
                  cropAreaStyle: { boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)' },
                }}
              />
            </div>
          </div>

          {/* Zoom slider */}
          <div className="px-5 pt-4 pb-1">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-base font-bold leading-none"
                aria-label="Zoom out"
              >−</button>
              <input
                type="range"
                min={1}
                max={4}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-slate-700 accent-sky-500"
                aria-label="Zoom"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(4, z + 0.2))}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-base font-bold leading-none"
                aria-label="Zoom in"
              >+</button>
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400 dark:text-gray-500">
              Zoom out to see the full image · Drag to position
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 px-5 py-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 py-2.5 text-sm font-semibold text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {isProcessing ? 'Processing…' : 'Apply Crop'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
