import * as fs from 'fs/promises';
import * as path from 'path';
import type { FileNode, CLIOptions } from '../types.js';
import { DEFAULT_MAX_FILE_SIZE } from '../types.js';
import { isBinary, isBinaryExtension } from '../utils/binary.js';
import { shouldExclude } from '../utils/patterns.js';
import { processNotebook } from './notebook.js';

/**
 * Process a file and return its content
 */
export async function processFile(
  filePath: string,
  relativePath: string,
  options: CLIOptions = {}
): Promise<FileNode> {
  const name = path.basename(filePath);
  const stats = await fs.stat(filePath);
  const maxSize = options.maxFileSize || DEFAULT_MAX_FILE_SIZE;

  const node: FileNode = {
    name,
    path: relativePath,
    type: 'file',
    size: stats.size
  };

  // Check if binary by extension first (faster)
  if (isBinaryExtension(name)) {
    node.isBinary = true;
    return node;
  }

  // Check file size
  if (stats.size > maxSize) {
    node.isBinary = true;
    node.content = `[File too large: ${stats.size} bytes, max: ${maxSize} bytes]`;
    return node;
  }

  // Read file content
  try {
    const buffer = await fs.readFile(filePath);

    // Check if binary by content
    if (isBinary(buffer)) {
      node.isBinary = true;
      return node;
    }

    const content = buffer.toString('utf-8');

    // Handle Jupyter notebooks
    if (name.endsWith('.ipynb')) {
      node.isNotebook = true;
      node.content = processNotebook(content);
    } else {
      node.content = content;
    }
  } catch (error) {
    node.content = `[Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }

  return node;
}

/**
 * Process a directory recursively
 */
export async function processDirectory(
  dirPath: string,
  options: CLIOptions = {},
  basePath: string = ''
): Promise<FileNode> {
  const name = path.basename(dirPath);
  const relativePath = basePath ? `${basePath}/${name}` : name;

  const node: FileNode = {
    name,
    path: relativePath,
    type: 'directory',
    size: 0,
    children: []
  };

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      const entryRelativePath = `${relativePath}/${entry.name}`;

      // Check if should be excluded
      if (shouldExclude(entryRelativePath, options.exclude, options.include, entry.isDirectory())) {
        continue;
      }

      if (entry.isDirectory()) {
        const childNode = await processDirectory(entryPath, options, relativePath);
        node.children!.push(childNode);
        node.size += childNode.size;
      } else if (entry.isFile()) {
        const fileNode = await processFile(entryPath, entryRelativePath, options);
        node.children!.push(fileNode);
        node.size += fileNode.size;
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error);
  }

  return node;
}
