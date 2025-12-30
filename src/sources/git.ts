import { simpleGit } from 'simple-git';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type { CLIOptions, SourceType } from '../types.js';
import { processDirectory } from '../processors/file.js';
import { buildTree } from '../processors/tree.js';
import { estimateTokens } from '../output/tokenizer.js';
import { createProcessingResult, formatOutput } from '../output/formatter.js';

/**
 * Check if a URL is a Git repository
 */
export function isGitUrl(url: string): boolean {
  const gitPatterns = [
    /^https?:\/\/(github|gitlab|bitbucket)\.com\//,
    /^https?:\/\/.*\.git$/,
    /^git@/,
    /^git:\/\//
  ];

  return gitPatterns.some(pattern => pattern.test(url));
}

/**
 * Extract repository name from Git URL
 */
function getRepoName(url: string): string {
  // Remove .git suffix
  let name = url.replace(/\.git$/, '');

  // Get the last path segment
  const parts = name.split('/');
  name = parts[parts.length - 1];

  // Clean up any query parameters
  name = name.split('?')[0];

  return name || 'repository';
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
 * Process a Git repository
 */
export async function processGitSource(
  repoUrl: string,
  options: CLIOptions = {}
): Promise<string> {
  const repoName = getRepoName(repoUrl);
  const tempDir = path.join(os.tmpdir(), `zipingest-git-${Date.now()}`);

  try {
    // Clone the repository (shallow clone for speed)
    const git = simpleGit();
    await git.clone(repoUrl, tempDir, ['--depth', '1']);

    // Process the cloned repository
    const root = await processDirectory(tempDir, {
      ...options,
      // Always exclude .git directory for git sources
      exclude: [...(options.exclude || []), '.git/**']
    });

    // Override the name with the repo name
    root.name = repoName;
    root.path = repoName;

    // Build tree representation
    const tree = buildTree(root);

    // Estimate tokens
    const tokens = estimateTokens([root]);

    // Create and format result
    const result = createProcessingResult(root, tree, 'git' as SourceType, tokens);

    return formatOutput(result, {
      noTree: options.noTree,
      noStats: options.noStats
    });
  } finally {
    // Clean up temp directory
    await cleanup(tempDir);
  }
}
