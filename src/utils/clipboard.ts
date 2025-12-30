import clipboardy from 'clipboardy';

/**
 * Copy text to system clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  await clipboardy.write(text);
}

/**
 * Read text from system clipboard
 */
export async function readFromClipboard(): Promise<string> {
  return await clipboardy.read();
}
