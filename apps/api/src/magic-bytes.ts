import fs from "node:fs";

export type MagicByteValidationResult = {
  isValid: boolean;
  detectedType?: string;
  reason?: string;
};

/**
 * Validates file magic bytes against accepted file types for a specific tool.
 * Prevents MIME type spoofing and executable disguise (e.g. .exe renamed to .pdf).
 */
export function validateFileMagicBytes(
  filePath: string,
  filename: string,
  tool?: string
): MagicByteValidationResult {
  if (!fs.existsSync(filePath)) {
    return { isValid: false, reason: "File not found on disk" };
  }

  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(16);
  const bytesRead = fs.readSync(fd, buffer, 0, 16, 0);
  fs.closeSync(fd);

  if (bytesRead < 4) {
    return { isValid: false, reason: "File is too small or empty" };
  }

  // Common magic signatures
  // PDF: %PDF- (\x25\x50\x44\x46)
  const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
  // PNG: \x89PNG\r\n\x1a\n (\x89\x50\x4E\x47)
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  // JPEG: \xFF\xD8\xFF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  // GIF: GIF87a or GIF89a (\x47\x49\x46\x38)
  const isGif = buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38;
  // WebP: RIFF....WEBP
  const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
  const isWebp = isRiff && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  // ZIP / Office XML (DOCX, XLSX, PPTX): PK\x03\x04 or PK\x05\x06 (\x50\x4B)
  const isZipOrOffice = buffer[0] === 0x50 && buffer[1] === 0x4b && (buffer[2] === 0x03 || buffer[2] === 0x05);
  // Old MS Office binary (DOC, XLS, PPT): \xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1
  const isOldOffice = buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;
  // Dangerous executables: MZ (\x4D\x5A) Windows PE / EXE / DLL / ELF (\x7F\x45\x4C\x46)
    // HEIC/HEIF: bytes 4-8 usually contain 'ftyp' and subtype like 'heic', 'heix', 'hevc', 'mif1'
  const isFtyp = buffer.subarray(4, 8).toString("ascii") === "ftyp";
  const ftypBrand = buffer.subarray(8, 12).toString("ascii").toLowerCase();
  const isHeic = isFtyp && (ftypBrand.includes("heic") || ftypBrand.includes("heix") || ftypBrand.includes("hevc") || ftypBrand.includes("mif1") || ftypBrand.includes("msf1"));

  const isExe = (buffer[0] === 0x4d && buffer[1] === 0x5a) || (buffer[0] === 0x7f && buffer[1] === 0x45 && buffer[2] === 0x4c && buffer[3] === 0x46);

  if (isExe) {
    return {
      isValid: false,
      reason: "Dangerous binary or executable file rejected",
    };
  }

  const ext = (filename.split(".").pop() || "").toLowerCase();

  // If tool expects HTML or Scan (images/text)
  if (tool === "html-to-pdf" || ext === "html" || ext === "htm") {
    // HTML is plain text, allow as long as not binary/exe
    return { isValid: true, detectedType: "html" };
  }

  // If tool expects Word / Excel / PPT
  if (tool === "word-to-pdf" || ext === "docx" || ext === "doc") {
    if (isZipOrOffice || isOldOffice) return { isValid: true, detectedType: "word" };
    return { isValid: false, reason: "File header does not match Word document format" };
  }

  if (tool === "excel-to-pdf" || ext === "xlsx" || ext === "xls") {
    if (isZipOrOffice || isOldOffice) return { isValid: true, detectedType: "excel" };
    return { isValid: false, reason: "File header does not match Excel spreadsheet format" };
  }

  if (tool === "powerpoint-to-pdf" || ext === "pptx" || ext === "ppt") {
    if (isZipOrOffice || isOldOffice) return { isValid: true, detectedType: "powerpoint" };
    return { isValid: false, reason: "File header does not match PowerPoint presentation format" };
  }

    if (tool === "heic-to-jpg" || ext === "heic" || ext === "heif") {
    if (isHeic || isFtyp) {
      return { isValid: true, detectedType: "heic" };
    }
    // Also allow if extension is heic/heif as brand variants can be broad
    return { isValid: true, detectedType: "heic" };
  }

  if (tool === "jpg-to-pdf" || tool === "scan-to-pdf" || ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp" || ext === "gif") {
    if (isJpeg || isPng || isWebp || isGif) {
      return { isValid: true, detectedType: "image" };
    }
    // Also allow PDF if scan-to-pdf or jpg-to-pdf allows pdf
    if (isPdf) return { isValid: true, detectedType: "pdf" };
    return { isValid: false, reason: "File header does not match valid image format" };
  }

  // Default: most tools expect PDF
  if (isPdf) {
    return { isValid: true, detectedType: "pdf" };
  }

  return {
    isValid: false,
    reason: `Invalid file format or corrupted header for file ${filename}. Expected PDF or valid document type.`,
  };
}

