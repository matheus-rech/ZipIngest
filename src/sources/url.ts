import type { FileNode, CLIOptions, SourceType } from '../types.js';
import { estimateTokens } from '../output/tokenizer.js';
import { createProcessingResult, formatOutput } from '../output/formatter.js';

/**
 * Check if a string is a valid HTTP(S) URL (not a Git URL)
 */
export function isWebUrl(url: string): boolean {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return false;
  }

  // Exclude Git repository URLs
  const gitPatterns = [
    /github\.com\/[^/]+\/[^/]+$/,
    /gitlab\.com\/[^/]+\/[^/]+$/,
    /bitbucket\.org\/[^/]+\/[^/]+$/,
    /\.git$/
  ];

  return !gitPatterns.some(pattern => pattern.test(url));
}

/**
 * Extract filename from URL
 */
function getFilenameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();

    if (filename && filename.includes('.')) {
      return filename;
    }

    // Default to index.html for root pages
    return 'page.html';
  } catch {
    return 'page.html';
  }
}

/**
 * Fetch content from a URL
 */
export async function processUrlSource(
  url: string,
  options: CLIOptions = {}
): Promise<string> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();
    const filename = getFilenameFromUrl(url);

    // Create a simple file node for the URL content
    const root: FileNode = {
      name: filename,
      path: url,
      type: 'file',
      size: Buffer.byteLength(content, 'utf-8'),
      content
    };

    // Estimate tokens
    const tokens = estimateTokens([root]);

    // Create a simple tree (just the file)
    const tree = `└── ${filename}`;

    // Create and format result
    const result = createProcessingResult(root, tree, 'url' as SourceType, tokens);

    return formatOutput(result, {
      noTree: options.noTree,
      noStats: options.noStats
    });
  } catch (error) {
    throw new Error(`Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
