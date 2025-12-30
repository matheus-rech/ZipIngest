interface NotebookCell {
  cell_type: 'code' | 'markdown' | 'raw';
  source: string | string[];
  outputs?: NotebookOutput[];
}

interface NotebookOutput {
  output_type: string;
  text?: string | string[];
  data?: Record<string, string | string[]>;
}

interface Notebook {
  cells: NotebookCell[];
  metadata?: Record<string, unknown>;
}

/**
 * Process a Jupyter notebook and convert to readable format
 */
export function processNotebook(content: string): string {
  try {
    const notebook: Notebook = JSON.parse(content);
    const output: string[] = [];

    output.push('# Jupyter Notebook\n');

    for (let i = 0; i < notebook.cells.length; i++) {
      const cell = notebook.cells[i];
      const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;

      if (!source.trim()) continue;

      switch (cell.cell_type) {
        case 'markdown':
          output.push(source);
          output.push('');
          break;

        case 'code':
          output.push('```python');
          output.push(source);
          output.push('```');

          // Include cell outputs if present
          if (cell.outputs && cell.outputs.length > 0) {
            const outputText = extractOutputText(cell.outputs);
            if (outputText) {
              output.push('');
              output.push('**Output:**');
              output.push('```');
              output.push(outputText);
              output.push('```');
            }
          }
          output.push('');
          break;

        case 'raw':
          output.push('```');
          output.push(source);
          output.push('```');
          output.push('');
          break;
      }
    }

    return output.join('\n');
  } catch (error) {
    return `[Error parsing notebook: ${error instanceof Error ? error.message : 'Unknown error'}]`;
  }
}

/**
 * Extract text from notebook cell outputs
 */
function extractOutputText(outputs: NotebookOutput[]): string {
  const texts: string[] = [];

  for (const output of outputs) {
    if (output.text) {
      const text = Array.isArray(output.text) ? output.text.join('') : output.text;
      texts.push(text);
    } else if (output.data) {
      // Prefer text/plain output
      if (output.data['text/plain']) {
        const text = Array.isArray(output.data['text/plain'])
          ? output.data['text/plain'].join('')
          : output.data['text/plain'];
        texts.push(text);
      }
    }
  }

  return texts.join('\n').trim();
}
