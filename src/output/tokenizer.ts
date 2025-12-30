import { encode } from 'gpt-tokenizer';
import type { FileNode } from '../types.js';

/**
 * Count tokens in a string using GPT tokenizer
 */
export function countTokens(text: string): number {
  try {
    return encode(text).length;
  } catch {
    // Fallback: rough estimate based on characters
    return Math.ceil(text.length / 4);
  }
}

/**
 * Estimate total tokens for all files
 */
export function estimateTokens(files: FileNode[]): number {
  let total = 0;
  const separatorOverhead = 10; // Approximate tokens per file separator

  for (const file of flattenFiles(files)) {
    if (file.content) {
      total += countTokens(file.content) + separatorOverhead;
    }
  }

  return total;
}

/**
 * Flatten a file tree into a list of files (excluding directories)
 */
function flattenFiles(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];

  function traverse(node: FileNode) {
    if (node.type === 'file') {
      result.push(node);
    }
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  return result;
}

/**
 * Format token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens >= 1000000) {
    return `~${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `~${(tokens / 1000).toFixed(1)}k`;
  }
  return `~${tokens}`;
}
