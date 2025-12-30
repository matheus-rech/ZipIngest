/**
 * Detect if a buffer contains binary content
 * Uses null byte detection and UTF-8 decode test
 */
export function isBinary(buffer: Buffer): boolean {
  // Check for null bytes (common in binary files)
  for (let i = 0; i < Math.min(buffer.length, 8000); i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }

  // Try to decode as UTF-8
  try {
    const text = buffer.toString('utf-8');
    // Check for replacement character which indicates invalid UTF-8
    if (text.includes('\uFFFD')) {
      return true;
    }
  } catch {
    return true;
  }

  return false;
}

/**
 * Common binary file extensions
 */
const BINARY_EXTENSIONS = new Set([
  // Images
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.webp', '.svg', '.tiff', '.tif',
  // Audio
  '.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma',
  // Video
  '.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v',
  // Archives
  '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar', '.xz',
  // Executables
  '.exe', '.dll', '.so', '.dylib', '.bin', '.app',
  // Documents
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  // Fonts
  '.ttf', '.otf', '.woff', '.woff2', '.eot',
  // Database
  '.db', '.sqlite', '.sqlite3',
  // Other
  '.pyc', '.pyo', '.class', '.o', '.a', '.lib',
]);

/**
 * Check if a file is likely binary based on extension
 */
export function isBinaryExtension(filename: string): boolean {
  const ext = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  return ext ? BINARY_EXTENSIONS.has(ext) : false;
}
