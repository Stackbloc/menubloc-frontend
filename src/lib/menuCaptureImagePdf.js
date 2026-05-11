/**
 * Convert a camera image File to a single-page PDF File for menu-session-style uploads.
 * Same approach as PdfUploadPage OCR path (server expects pdf_file + image_file).
 */

async function loadImageElement(file) {
  const objectUrl = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => reject(new Error("Could not read this image. Try a JPG or PNG."));
    image.src = objectUrl;
  });
}

function base64ToUint8Array(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function buildSingleImagePdfBlob(jpegBytes, width, height) {
  const encoder = new TextEncoder();
  const parts = [];
  const offsets = [0];
  let length = 0;

  function pushText(text) {
    const bytes = encoder.encode(text);
    parts.push(bytes);
    length += bytes.length;
  }

  function pushBytes(bytes) {
    parts.push(bytes);
    length += bytes.length;
  }

  pushText("%PDF-1.3\n");

  offsets[1] = length;
  pushText("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  offsets[2] = length;
  pushText("2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n");

  offsets[3] = length;
  pushText(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  offsets[4] = length;
  pushText(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushText("\nendstream\nendobj\n");

  const contents = `q\n${width} 0 0 ${height} 0 0 cm\n/Im0 Do\nQ\n`;
  offsets[5] = length;
  pushText(`5 0 obj\n<< /Length ${contents.length} >>\nstream\n${contents}endstream\nendobj\n`);

  const xrefOffset = length;
  pushText("xref\n0 6\n0000000000 65535 f \n");
  for (let index = 1; index <= 5; index += 1) {
    pushText(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`);
  }
  pushText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(parts, { type: "application/pdf" });
}

export function isCaptureImageFile(file) {
  return Boolean(file?.type?.startsWith("image/"));
}

export async function convertImageFileToPdf(file) {
  const { image, objectUrl } = await loadImageElement(file);
  try {
    const maxDimension = 2200;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not prepare your image for upload on this device.");
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const base64 = jpegDataUrl.split(",")[1];
    if (!base64) throw new Error("Could not prepare your image for upload.");

    const jpegBytes = base64ToUint8Array(base64);
    const pdfBlob = buildSingleImagePdfBlob(jpegBytes, width, height);
    const baseName = file.name.replace(/\.[^.]+$/, "") || "menu-scan";
    return new File([pdfBlob], `${baseName}.pdf`, {
      type: "application/pdf",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function buildCapturePreviewUrl(file) {
  return URL.createObjectURL(file);
}
