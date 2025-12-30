import { minimatch } from 'minimatch';
import { DEFAULT_EXCLUDES } from '../types.js';

/**
 * Check if a path matches any of the given patterns
 */
export function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some(pattern => minimatch(path, pattern, { dot: true }));
}

/**
 * Check if a path should be excluded based on default and custom patterns
 * @param isDirectory - if true, include patterns are not applied (to allow directory traversal)
 */
export function shouldExclude(
  path: string,
  customExcludes: string[] = [],
  customIncludes: string[] = [],
  isDirectory: boolean = false
): boolean {
  // Check custom excludes first
  if (matchesPattern(path, customExcludes)) {
    return true;
  }

  // Check default excludes
  if (matchesPattern(path, DEFAULT_EXCLUDES)) {
    return true;
  }

  // If include patterns are specified, only include matching files
  // Don't apply include patterns to directories (to allow traversal)
  if (!isDirectory && customIncludes.length > 0) {
    if (!matchesPattern(path, customIncludes)) {
      return true;
    }
  }

  return false;
}

/**
 * Filter a list of paths based on include/exclude patterns
 */
export function filterPaths(
  paths: string[],
  includes: string[] = [],
  excludes: string[] = []
): string[] {
  return paths.filter(path => !shouldExclude(path, excludes, includes));
}
