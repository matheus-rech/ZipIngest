#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs/promises';
import chalk from 'chalk';
import ora from 'ora';
import type { CLIOptions, SourceType } from './types.js';
import { isZipFile, processZipSource } from './sources/zip.js';
import { isDirectory, processDirectorySource, getDirectoryTree } from './sources/directory.js';
import { isGitUrl, processGitSource } from './sources/git.js';
import { isWebUrl, processUrlSource } from './sources/url.js';
import { copyToClipboard } from './utils/clipboard.js';
import { selectFiles } from './interactive/selector.js';
import { processDirectory } from './processors/file.js';
import { buildTree } from './processors/tree.js';
import { estimateTokens } from './output/tokenizer.js';
import { createProcessingResult, formatOutput } from './output/formatter.js';

/**
 * Detect the source type from input
 */
async function detectSourceType(input: string): Promise<SourceType> {
  if (isZipFile(input)) {
    return 'zip';
  }

  if (isGitUrl(input)) {
    return 'git';
  }

  if (isWebUrl(input)) {
    return 'url';
  }

  if (await isDirectory(input)) {
    return 'directory';
  }

  throw new Error(`Unknown source type: ${input}`);
}

/**
 * Process source with interactive selection
 */
async function processWithInteractive(
  input: string,
  sourceType: SourceType,
  options: CLIOptions
): Promise<string> {
  const spinner = ora('Loading file tree...').start();

  try {
    let root;

    switch (sourceType) {
      case 'directory':
        root = await getDirectoryTree(input, options);
        break;
      case 'zip':
        // For zip, we need to extract and process
        spinner.text = 'Extracting zip file...';
        // Use the normal process but intercept for selection
        // For simplicity, fall through to non-interactive for now
        spinner.stop();
        return processZipSource(input, options);
      default:
        spinner.stop();
        console.log(chalk.yellow('Interactive mode only supported for directories and zip files.'));
        return processSource(input, options);
    }

    spinner.stop();

    // Let user select files
    const selectedRoot = await selectFiles(root);

    if (!selectedRoot) {
      return '';
    }

    // Build output from selected files
    const tree = buildTree(selectedRoot);
    const tokens = estimateTokens([selectedRoot]);
    const result = createProcessingResult(selectedRoot, tree, sourceType, tokens);

    return formatOutput(result, {
      noTree: options.noTree,
      noStats: options.noStats
    });
  } catch (error) {
    spinner.stop();
    throw error;
  }
}

/**
 * Main processing function
 */
async function processSource(input: string, options: CLIOptions): Promise<string> {
  const sourceType = await detectSourceType(input);
  const spinner = ora(`Processing ${sourceType}...`).start();

  try {
    let output: string;

    switch (sourceType) {
      case 'zip':
        spinner.text = 'Extracting and processing zip file...';
        output = await processZipSource(input, options);
        break;

      case 'directory':
        spinner.text = 'Processing directory...';
        output = await processDirectorySource(input, options);
        break;

      case 'git':
        spinner.text = 'Cloning and processing repository...';
        output = await processGitSource(input, options);
        break;

      case 'url':
        spinner.text = 'Fetching URL content...';
        output = await processUrlSource(input, options);
        break;

      default:
        throw new Error(`Unsupported source type: ${sourceType}`);
    }

    spinner.succeed(`Processed ${sourceType} successfully`);
    return output;
  } catch (error) {
    spinner.fail(`Failed to process ${sourceType}`);
    throw error;
  }
}

/**
 * CLI entry point
 */
const program = new Command();

program
  .name('zipingest')
  .description('Transform sources (zip, directories, Git repos, URLs) into LLM-friendly markdown digests')
  .version('1.0.0')
  .argument('<source>', 'Zip file, directory, Git URL, or web URL')
  .option('-o, --output <file>', 'Output file path')
  .option('-i, --include <patterns...>', 'Include patterns (glob)')
  .option('-e, --exclude <patterns...>', 'Exclude patterns (glob)')
  .option('-s, --max-size <bytes>', 'Max file size in bytes', '1048576')
  .option('-c, --clipboard', 'Copy output to clipboard')
  .option('--interactive', 'Interactive file selection mode')
  .option('--no-tree', 'Skip directory tree in output')
  .option('--no-stats', 'Skip statistics in output')
  .action(async (source: string, opts) => {
    try {
      const options: CLIOptions = {
        output: opts.output,
        include: opts.include,
        exclude: opts.exclude,
        maxFileSize: parseInt(opts.maxSize, 10),
        clipboard: opts.clipboard,
        interactive: opts.interactive,
        noTree: !opts.tree,
        noStats: !opts.stats
      };

      let output: string;

      if (options.interactive) {
        const sourceType = await detectSourceType(source);
        output = await processWithInteractive(source, sourceType, options);
      } else {
        output = await processSource(source, options);
      }

      if (!output) {
        return;
      }

      // Handle output
      if (options.output) {
        await fs.writeFile(options.output, output, 'utf-8');
        console.log(chalk.green(`Output saved to: ${options.output}`));
      } else if (options.clipboard) {
        await copyToClipboard(output);
        console.log(chalk.green('Output copied to clipboard!'));
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      process.exit(1);
    }
  });

program.parse();
