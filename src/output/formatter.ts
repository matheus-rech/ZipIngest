import type { FileNode, ProcessingResult, Summary, SourceType } from '../types.js';
import { formatTokenCount } from './tokenizer.js';

const SEPARATOR = '================================================';

/**
 * Format file size for display
 */
export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${bytes} B`;
}

/**
 * Format the summary header
 */
function formatSummary(summary: Summary): string {
  return `${SEPARATOR}
Source: ${summary.sourceName}
Type: ${summary.sourceType}
Files analyzed: ${summary.filesAnalyzed}
Total size: ${formatSize(summary.totalSize)}
Estimated tokens: ${formatTokenCount(summary.estimatedTokens)}
${SEPARATOR}`;
}

/**
 * Format file content with separator
 */
function formatFileContent(file: FileNode): string {
  if (file.isBinary) {
    return `${SEPARATOR}
FILE: ${file.path}
${SEPARATOR}
[Binary file - ${formatSize(file.size)}]
`;
  }

  return `${SEPARATOR}
FILE: ${file.path}
${SEPARATOR}
${file.content || '[Empty file]'}
`;
}

/**
 * Flatten file tree and format all file contents
 */
function formatAllContents(node: FileNode): string {
  const contents: string[] = [];

  function traverse(n: FileNode) {
    if (n.type === 'file') {
      contents.push(formatFileContent(n));
    }
    if (n.children) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return contents.join('\n');
}

/**
 * Format the complete output
 */
export function formatOutput(
  result: ProcessingResult,
  options: { noTree?: boolean; noStats?: boolean } = {}
): string {
  const parts: string[] = [];

  if (!options.noStats) {
    parts.push(formatSummary(result.summary));
  }

  if (!options.noTree && result.tree) {
    parts.push(`\nDirectory structure:\n${result.tree}`);
  }

  if (result.content) {
    parts.push(`\n${result.content}`);
  }

  return parts.join('\n');
}

/**
 * Create processing result from file tree
 */
export function createProcessingResult(
  root: FileNode,
  tree: string,
  sourceType: SourceType,
  estimatedTokens: number
): ProcessingResult {
  const { filesCount, totalSize } = calculateStats(root);

  return {
    summary: {
      sourceName: root.name,
      sourceType,
      filesAnalyzed: filesCount,
      totalSize,
      estimatedTokens
    },
    tree,
    content: formatAllContents(root)
  };
}

/**
 * Calculate file statistics
 */
function calculateStats(node: FileNode): { filesCount: number; totalSize: number } {
  let filesCount = 0;
  let totalSize = 0;

  function traverse(n: FileNode) {
    if (n.type === 'file') {
      filesCount++;
      totalSize += n.size;
    }
    if (n.children) {
      for (const child of n.children) {
        traverse(child);
      }
    }
  }

  traverse(node);
  return { filesCount, totalSize };
}
