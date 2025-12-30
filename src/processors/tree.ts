import type { FileNode } from '../types.js';

/**
 * Build an ASCII tree representation of the file structure
 */
export function buildTree(node: FileNode, prefix: string = '', isLast: boolean = true): string {
  const lines: string[] = [];
  const connector = isLast ? '└── ' : '├── ';
  const extension = isLast ? '    ' : '│   ';

  // Add current node (skip root if it's a directory at the top level)
  if (prefix !== '' || node.type === 'file') {
    lines.push(`${prefix}${connector}${node.name}${node.type === 'directory' ? '/' : ''}`);
  } else {
    lines.push(`${node.name}/`);
  }

  // Process children if directory
  if (node.children && node.children.length > 0) {
    const sortedChildren = sortNodes(node.children);
    const newPrefix = prefix === '' ? '' : prefix + extension;

    for (let i = 0; i < sortedChildren.length; i++) {
      const child = sortedChildren[i];
      const isLastChild = i === sortedChildren.length - 1;
      lines.push(buildTree(child, newPrefix, isLastChild));
    }
  }

  return lines.join('\n');
}

/**
 * Sort nodes: directories first, then files, alphabetically
 */
function sortNodes(nodes: FileNode[]): FileNode[] {
  return [...nodes].sort((a, b) => {
    // Directories first
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    // Then alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * Build a simple flat tree (useful for large directories)
 */
export function buildFlatTree(node: FileNode): string {
  const paths: string[] = [];

  function traverse(n: FileNode, currentPath: string = '') {
    const path = currentPath ? `${currentPath}/${n.name}` : n.name;

    if (n.type === 'file') {
      paths.push(path);
    } else {
      if (n.children) {
        for (const child of n.children) {
          traverse(child, path);
        }
      }
    }
  }

  traverse(node);
  return paths.sort().join('\n');
}
