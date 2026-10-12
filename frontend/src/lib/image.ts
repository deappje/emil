/**
 * Scales a photo down to at most `max` pixels on its long side and encodes
 * it as JPEG, so a 6 MB phone photo uploads as a few hundred kilobytes.
 */
export async function shrinkImage(file: File, max = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("Dit bestand kan niet als afbeelding worden gelezen.");
  });
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("De foto kon niet worden verkleind."))), "image/jpeg", quality),
  );
}
