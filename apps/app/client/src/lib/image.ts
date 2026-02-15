export async function compressImageFileToJpegDataUrl(
  file: File,
  opts: {
    maxSize: number;
    quality: number;
    maxDataUrlLength: number;
    fill?: string;
  }
): Promise<string> {
  if (!file) {
    throw new Error("file_required");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("file_not_image");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });

  if (!dataUrl) throw new Error("read_failed");

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image_failed"));
    img.src = dataUrl;
  });

  const scale = Math.min(1, opts.maxSize / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_failed");

  ctx.fillStyle = opts.fill || "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const compressed = canvas.toDataURL("image/jpeg", opts.quality);
  if (compressed.length > opts.maxDataUrlLength) throw new Error("too_large");
  return compressed;
}

