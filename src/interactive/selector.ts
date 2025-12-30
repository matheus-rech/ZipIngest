import inquirer from 'inquirer';
import type { FileNode } from '../types.js';
import { formatSize } from '../output/formatter.js';

interface FileChoice {
  name: string;
  value: string;
  checked: boolean;
}

/**
 * Flatten file tree into a list of file paths
 */
function flattenTree(node: FileNode, parentPath: string = ''): FileNode[] {
  const result: FileNode[] = [];
  const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;

  if (node.type === 'file') {
    result.push({ ...node, path: currentPath });
  }

  if (node.children) {
    for (const child of node.children) {
      result.push(...flattenTree(child, currentPath));
    }
  }

  return result;
}

/**
 * Filter file tree by selected paths
 */
function filterByPaths(node: FileNode, selectedPaths: Set<string>): FileNode | null {
  if (node.type === 'file') {
    return selectedPaths.has(node.path) ? { ...node } : null;
  }

  // For directories, recursively filter children
  const filteredChildren: FileNode[] = [];

  if (node.children) {
    for (const child of node.children) {
      const filtered = filterByPaths(child, selectedPaths);
      if (filtered) {
        filteredChildren.push(filtered);
      }
    }
  }

  // Only include directory if it has children
  if (filteredChildren.length > 0) {
    return {
      ...node,
      children: filteredChildren
    };
  }

  return null;
}

/**
 * Interactive file selector using inquirer
 */
export async function selectFiles(root: FileNode): Promise<FileNode | null> {
  const flatFiles = flattenTree(root);

  if (flatFiles.length === 0) {
    console.log('No files found to select.');
    return null;
  }

  // Create choices for inquirer
  const choices: FileChoice[] = flatFiles.map(file => ({
    name: `${file.path} (${formatSize(file.size)})${file.isBinary ? ' [binary]' : ''}`,
    value: file.path,
    checked: !file.isBinary // Pre-select non-binary files
  }));

  // Prompt user to select files
  const { selected } = await inquirer.prompt<{ selected: string[] }>([
    {
      type: 'checkbox',
      name: 'selected',
      message: 'Select files to include:',
      choices,
      pageSize: 20,
      loop: false
    }
  ]);

  if (selected.length === 0) {
    console.log('No files selected.');
    return null;
  }

  // Filter the tree based on selection
  const selectedPaths = new Set(selected);
  return filterByPaths(root, selectedPaths);
}

/**
 * Ask user for confirmation before proceeding
 */
export async function confirmAction(message: string): Promise<boolean> {
  const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
    {
      type: 'confirm',
      name: 'confirmed',
      message,
      default: true
    }
  ]);

  return confirmed;
}
