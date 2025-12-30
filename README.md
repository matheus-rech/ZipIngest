# ZipIngest

Transform any source into LLM-friendly markdown digests. Similar to [gitingest](https://gitingest.com), but as a powerful CLI tool that works with multiple input types.

## Features

- **Multi-source support**: Process zip files, local directories, Git repositories, and web URLs
- **LLM-optimized output**: Structured markdown format perfect for AI/LLM consumption
- **Smart filtering**: Include/exclude files using glob patterns
- **Token estimation**: Know your token count before sending to an LLM
- **Binary detection**: Automatically skips binary files
- **Jupyter notebooks**: Converts `.ipynb` files to readable markdown
- **Interactive mode**: TUI to select specific files before processing
- **Flexible output**: stdout, file, or clipboard

## Installation

```bash
# Clone and install globally
git clone https://github.com/matheus-rech/ZipIngest.git
cd ZipIngest
npm install
npm run build
npm link

# Or install directly from npm (coming soon)
npm install -g zipingest
```

## Usage

### Basic Usage

```bash
# Process a local directory
zipingest ./my-project

# Process a zip file
zipingest ./archive.zip

# Process a GitHub repository
zipingest https://github.com/user/repo

# Process a web page
zipingest https://example.com/page.html
```

### Output Options

```bash
# Save to file
zipingest ./project -o digest.md

# Copy to clipboard
zipingest ./project -c

# Output to stdout (default)
zipingest ./project
```

### Filtering Files

```bash
# Include only TypeScript files
zipingest ./project -i "**/*.ts"

# Include multiple patterns
zipingest ./project -i "**/*.ts" "**/*.tsx"

# Exclude test files
zipingest ./project -e "**/*.test.ts" "**/*.spec.ts"

# Combine include and exclude
zipingest ./project -i "src/**" -e "**/*.test.ts"
```

### Advanced Options

```bash
# Interactive file selection mode
zipingest ./project --interactive

# Skip directory tree in output
zipingest ./project --no-tree

# Skip statistics header
zipingest ./project --no-stats

# Set max file size (in bytes)
zipingest ./project -s 2097152  # 2MB limit
```

## Output Format

ZipIngest produces a gitingest-compatible markdown format:

```markdown
================================================
Source: my-project
Type: directory
Files analyzed: 42
Total size: 156.2 KB
Estimated tokens: ~12.5k
================================================

Directory structure:
my-project/
├── src/
│   ├── index.ts
│   └── utils.ts
├── package.json
└── README.md

================================================
FILE: src/index.ts
================================================
[file content here]

================================================
FILE: src/utils.ts
================================================
[file content here]
```

## Supported Sources

| Source Type | Example | Description |
|-------------|---------|-------------|
| Directory | `./my-project` | Local folder |
| Zip File | `./archive.zip` | Compressed archive |
| GitHub | `https://github.com/user/repo` | Git repository URL |
| GitLab | `https://gitlab.com/user/repo` | Git repository URL |
| Bitbucket | `https://bitbucket.org/user/repo` | Git repository URL |
| Web URL | `https://example.com/page.html` | Any web page |

## Default Exclusions

The following patterns are excluded by default:

- `node_modules/**`
- `.git/**`
- `*.lock`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `dist/**`, `build/**`, `.next/**`
- `*.min.js`, `*.min.css`, `*.map`
- `.DS_Store`, `Thumbs.db`
- `*.pyc`, `__pycache__/**`
- `.env*`, `*.log`
- `.vscode/**`, `.idea/**`
- `coverage/**`, `.nyc_output/**`

## API

ZipIngest can also be used programmatically:

```typescript
import { processDirectorySource } from 'zipingest/sources/directory';
import { processZipSource } from 'zipingest/sources/zip';
import { processGitSource } from 'zipingest/sources/git';

// Process a directory
const output = await processDirectorySource('./my-project', {
  include: ['**/*.ts'],
  exclude: ['**/*.test.ts']
});

console.log(output);
```

## Configuration

### CLI Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output <file>` | `-o` | Output file path | stdout |
| `--include <patterns...>` | `-i` | Include glob patterns | all files |
| `--exclude <patterns...>` | `-e` | Exclude glob patterns | defaults |
| `--max-size <bytes>` | `-s` | Max file size | 1048576 (1MB) |
| `--clipboard` | `-c` | Copy to clipboard | false |
| `--interactive` | | Interactive mode | false |
| `--no-tree` | | Skip directory tree | false |
| `--no-stats` | | Skip statistics | false |

## Use Cases

### Preparing Code for LLM Analysis

```bash
# Get a full project digest for Claude/GPT analysis
zipingest ./my-app -o context.md
```

### Code Review Preparation

```bash
# Get only source files, excluding tests
zipingest ./project -i "src/**" -e "**/*.test.*" -o review.md
```

### Documentation Generation

```bash
# Include only markdown and code files
zipingest ./docs -i "**/*.md" "**/*.ts" -o docs-digest.md
```

### Repository Exploration

```bash
# Quickly explore a GitHub repo
zipingest https://github.com/interesting/project -c
# Now paste into your favorite LLM!
```

## Development

```bash
# Clone the repository
git clone https://github.com/matheus-rech/ZipIngest.git
cd ZipIngest

# Install dependencies
npm install

# Run in development mode
npm run dev -- ./test-folder

# Build
npm run build

# Link globally for testing
npm link
```

## Project Structure

```
zipingest/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── types.ts              # TypeScript interfaces
│   ├── sources/
│   │   ├── directory.ts      # Directory processing
│   │   ├── zip.ts            # Zip extraction
│   │   ├── git.ts            # Git clone & process
│   │   └── url.ts            # URL fetching
│   ├── processors/
│   │   ├── file.ts           # File content processing
│   │   ├── notebook.ts       # Jupyter notebook handling
│   │   └── tree.ts           # Directory tree building
│   ├── output/
│   │   ├── formatter.ts      # Output formatting
│   │   └── tokenizer.ts      # Token counting
│   ├── interactive/
│   │   └── selector.ts       # Interactive TUI
│   └── utils/
│       ├── binary.ts         # Binary file detection
│       ├── patterns.ts       # Glob pattern matching
│       └── clipboard.ts      # Clipboard operations
├── bin/
│   └── zipingest             # Executable entry
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- [commander](https://www.npmjs.com/package/commander) - CLI framework
- [adm-zip](https://www.npmjs.com/package/adm-zip) - Zip extraction
- [simple-git](https://www.npmjs.com/package/simple-git) - Git operations
- [gpt-tokenizer](https://www.npmjs.com/package/gpt-tokenizer) - Token counting
- [inquirer](https://www.npmjs.com/package/inquirer) - Interactive prompts
- [minimatch](https://www.npmjs.com/package/minimatch) - Glob matching
- [chalk](https://www.npmjs.com/package/chalk) - Terminal colors
- [ora](https://www.npmjs.com/package/ora) - Spinners
- [clipboardy](https://www.npmjs.com/package/clipboardy) - Clipboard access

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Acknowledgments

Inspired by [gitingest](https://gitingest.com) - a fantastic web tool for creating LLM-friendly repository digests.
