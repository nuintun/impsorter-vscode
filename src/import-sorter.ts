import { Range, Selection, TextEditor, window, WorkspaceConfiguration } from 'vscode';

enum SortConfig {
  SingleLine,
  MultiLine,
  WordGroup,
  MaxWidth
}

interface Options {
  tabWidth: number;
  inputPerLine: number;
  lineMaxWidth: number;
  trailingComma: boolean;
}

export class ImportSorter {
  private defaultTabWidth = this.config.defaultTabWidth;
  private trailingComma = this.config.trailingComma;
  private inputPerLine = this.config.inputPerLine;
  private lineMaxWidth = this.config.lineMaxWidth;

  constructor(private config: WorkspaceConfiguration) {}

  // extension.sortImportLine
  public sortImportLine(): void {
    this.handleSorting(SortConfig.SingleLine);
  }

  public sortImportsPerLine(): void {
    this.handleSorting(SortConfig.MultiLine);
  }

  // extension.sortImportLinesOnWordGroupingCommand
  public sortImportLinesOnWordGroupingCommand(): void {
    this.handleSorting(SortConfig.WordGroup);
  }

  // extension.sortImportLinesOnMaxCharWidthCommand
  public sortImportLinesOnMaxCharWidthCommand(): void {
    this.handleSorting(SortConfig.MaxWidth);
  }

  // TODO: break up to not handle messaging
  private handleSorting(format: SortConfig): void {
    const activeEditor = this.checkEditorAndSelection(window.activeTextEditor, (error: string) =>
      window.showErrorMessage(error)
    );

    if (activeEditor) {
      const [editor, selection] = activeEditor;
      const selectionEndLine = editor.document.lineAt(selection.end.line);

      const range = new Range(selection.start.line, 0, selection.end.line, selectionEndLine.range.end.character);
      const input = editor.document.getText(range);

      if (isImportStatement(input)) {
        const config: Options = {
          tabWidth: this.defaultTabWidth,
          trailingComma: this.trailingComma,
          inputPerLine: this.inputPerLine,
          lineMaxWidth: this.lineMaxWidth
        };
        const sortedImport = sortImportSelection(input, format, config);

        editor.edit(builder => builder.replace(range, sortedImport));
        window.showInformationMessage(`${selection.end.line - selection.start.line + 1} number of lines got sorted.`);
      } else {
        window.showErrorMessage(`Selection does not seem to contain import statement`);
      }
    }
  }

  // Make sure editor is active and that there is a selection.
  private checkEditorAndSelection(editor: TextEditor | undefined, cb: (err: string) => void): [TextEditor, Selection] | void {
    if (!editor) {
      return cb(`Editor is not active`);
    }

    if (!editor.selection) {
      return cb(`No valid selection`);
    }

    return [editor, editor.selection];
  }
}

function isImportStatement(selection: string): boolean {
  return /\b(import|export)\b(.|\s)*\bfrom\b/m.test(selection);
}

function sortImportSelection(selection: string, format: SortConfig, options: Options): string {
  return selection
    .trim()
    .replace(/(\s)+/gm, '$1')
    .replace(/\{[^.]*?\}/gm, exp => {
      const match = /\{(.*?)\}/gm.exec(exp);

      if (!match || !match[1]) return exp;

      const arrayToSort = match[1].split(',').filter(n => n);
      const sortedArray = sortArray(arrayToSort.map(n => n.trim()));

      return formatArray(sortedArray, format, options);
    });
}

function sortArray(arr: string[]): string[] {
  return arr.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

function formatArray(arr: string[], format: SortConfig, options: Options): string {
  const { tabWidth, trailingComma, inputPerLine, lineMaxWidth } = options;

  let formattedArray;

  switch (format) {
    case SortConfig.SingleLine:
      formattedArray = arr.map((entry, index) => (index !== 0 ? ` ${entry}` : entry));

      return `{ ${formattedArray} }`;
    case SortConfig.MultiLine:
      formattedArray = arr.map(entry => `\n${' '.repeat(tabWidth)}${entry}`);

      if (trailingComma) return `{${formattedArray},\n}`;

      return `{${formattedArray}\n}`;
    case SortConfig.WordGroup:
      return `{${formatLine(arr, inputPerLine, tabWidth, trailingComma)}\n}`;
    case SortConfig.MaxWidth:
      return `{\n${formatLineWidth(arr, lineMaxWidth, tabWidth, trailingComma)}\n}`;
    default:
      return arr.toString();
  }
}

function formatLine(arr: string[], perRow: number, tabWidth: number, trailingComma: boolean) {
  let res: string = '';

  for (let i = 0; i < arr.length; i++) {
    const newRow = i % perRow;

    if (!newRow) {
      res += `\n${' '.repeat(tabWidth)}`;
    }

    res += arr[i];

    if (i !== arr.length - 1) {
      res += ', ';
    }

    if (i === arr.length - 1 && trailingComma) {
      res += ',';
    }
  }

  return res;
}

function formatLineWidth(arr: string[], maxWidth: number, tabWidth: number, trailingComma: boolean) {
  let lineWidth = tabWidth;
  let res: string = ' '.repeat(tabWidth);

  for (let i = 0; i < arr.length; i++) {
    const currentLength = arr[i].length;

    if (i > 0 && lineWidth + currentLength > maxWidth) {
      lineWidth = tabWidth;
      res += `\n${' '.repeat(tabWidth)}`;
    }

    res += arr[i];

    if (i !== arr.length - 1) {
      res += ', ';
    }

    if (i === arr.length - 1 && trailingComma) {
      res += ',';
    }

    lineWidth += currentLength + 2;
  }

  return res;
}
