export type SourceType = 'zip' | 'directory' | 'git' | 'url';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  content?: string;
  children?: FileNode[];
  isBinary?: boolean;
  isNotebook?: boolean;
}

export interface ProcessingResult {
  summary: Summary;
  tree: string;
  content: string;
}

export interface Summary {
  sourceName: string;
  sourceType: SourceType;
  filesAnalyzed: number;
  totalSize: number;
  estimatedTokens: number;
}

export interface CLIOptions {
  output?: string;
  include?: string[];
  exclude?: string[];
  maxFileSize?: number;
  clipboard?: boolean;
  interactive?: boolean;
  noTree?: boolean;
  noStats?: boolean;
}

export const DEFAULT_EXCLUDES = [
  'node_modules/**',
  '.git/**',
  '*.lock',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'dist/**',
  'build/**',
  '.next/**',
  '*.min.js',
  '*.min.css',
  '*.map',
  '.DS_Store',
  'Thumbs.db',
  '*.pyc',
  '__pycache__/**',
  '.env*',
  '*.log',
  '.vscode/**',
  '.idea/**',
  'coverage/**',
  '.nyc_output/**'
];

export const DEFAULT_MAX_FILE_SIZE = 1048576; // 1MB
