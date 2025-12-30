import AdmZip from 'adm-zip';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type { CLIOptions, SourceType } from '../types.js';
import { processDirectory } from '../processors/file.js';
import { buildTree } from '../processors/tree.js';
import { estimateTokens } from '../output/tokenizer.js';
import { createProcessingResult, formatOutput } from '../output/formatter.js';

/**
 * Check if a path is a zip file
 */
export function isZipFile(inputPath: string): boolean {
  return inputPath.toLowerCase().endsWith('.zip');
}

/**
 * Extract zip file to a temporary directory
 */
async function extractZip(zipPath: string): Promise<string> {
  const tempDir = path.join(os.tmpdir(), `zipingest-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  const zip = new AdmZip(zipPath);
  zip.extractAllTo(tempDir, true);

  return tempDir;
}

/**
 * Clean up temporary directory
 */
async function cleanup(tempDir: string): Promise<void> {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Warning: Failed to clean up temp directory:', error);
  }
}

/**
 * Process a zip file
 */
export async function processZipSource(
  zipPath: string,
  options: CLIOptions = {}
): Promise<string> {
  const absolutePath = path.resolve(zipPath);
  const zipName = path.basename(zipPath, '.zip');

  let tempDir: string | null = null;

  try {
    // Extract zip to temp directory
    tempDir = await extractZip(absolutePath);

    // Find the root directory (handle both flat and nested zips)
    const entries = await fs.readdir(tempDir);
    let processPath = tempDir;

    // If there's only one directory at root, use it as the root
    if (entries.length === 1) {
      const singleEntry = path.join(tempDir, entries[0]);
      const stats = await fs.stat(singleEntry);
      if (stats.isDirectory()) {
        processPath = singleEntry;
      }
    }

    // Process the extracted contents
    const root = await processDirectory(processPath, options);

    // Override the name with the zip file name
    root.name = zipName;
    root.path = zipName;

    // Build tree representation
    const tree = buildTree(root);

    // Estimate tokens
    const tokens = estimateTokens([root]);

    // Create and format result
    const result = createProcessingResult(root, tree, 'zip' as SourceType, tokens);

    return formatOutput(result, {
      noTree: options.noTree,
      noStats: options.noStats
    });
  } finally {
    // Clean up temp directory
    if (tempDir) {
      await cleanup(tempDir);
    }
  }
}
