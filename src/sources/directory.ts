import * as fs from 'fs/promises';
import * as path from 'path';
import type { FileNode, CLIOptions, SourceType } from '../types.js';
import { processDirectory } from '../processors/file.js';
import { buildTree } from '../processors/tree.js';
import { estimateTokens } from '../output/tokenizer.js';
import { createProcessingResult, formatOutput } from '../output/formatter.js';

/**
 * Check if a path is a valid directory
 */
export async function isDirectory(inputPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(inputPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * Process a local directory
 */
export async function processDirectorySource(
  dirPath: string,
  options: CLIOptions = {}
): Promise<string> {
  const absolutePath = path.resolve(dirPath);

  // Process directory tree
  const root = await processDirectory(absolutePath, options);

  // Build tree representation
  const tree = buildTree(root);

  // Estimate tokens
  const tokens = estimateTokens([root]);

  // Create and format result
  const result = createProcessingResult(root, tree, 'directory' as SourceType, tokens);

  return formatOutput(result, {
    noTree: options.noTree,
    noStats: options.noStats
  });
}

/**
 * Get the root FileNode for a directory
 */
export async function getDirectoryTree(
  dirPath: string,
  options: CLIOptions = {}
): Promise<FileNode> {
  const absolutePath = path.resolve(dirPath);
  return await processDirectory(absolutePath, options);
}
