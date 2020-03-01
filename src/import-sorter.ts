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
  private config: WorkspaceConfiguration;
  private defaultTabWidth = this.config.defaultTabWidth;
  private trailingComma = this.config.trailingComma;
  private inputPerLine = this.config.inputPerLine;
  private lineMaxWidth = this.config.lineMaxWidth;

  constructor(config: WorkspaceConfiguration) {
    this.config = config;
  }

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
    const activeEditor = this.checkEditorAndSelection(window.activeTextEditor, (error: string) => {
      window.showErrorMessage(error);
      return;
    });

    if (activeEditor !== undefined) {
      const [editor, selection] = activeEditor;
      const selectionEndLine = editor.document.lineAt(selection.end.line);

      const range = new Range(selection.start.line, 0, selection.end.line, selectionEndLine.range.end.character);
      const input = editor.document.getText(range);

      if (!isImportStatement(input)) {
        window.showErrorMessage(`Selection does not seem to contain import statement`);

        return;
      }

      const config: Options = {
        tabWidth: this.defaultTabWidth,
        trailingComma: this.trailingComma,
        inputPerLine: this.inputPerLine,
        lineMaxWidth: this.lineMaxWidth
      };
      const sortedImport = sortImportSelection(input, format, config);

      editor.edit(builder => builder.replace(range, sortedImport));
      window.showInformationMessage(`${selection.end.line - selection.start.line + 1} number of lines got sorted.`);
    }
  }

  // Make sure editor is active and that there is a selection.
  private checkEditorAndSelection(editor: TextEditor | undefined, cb: (err: string) => void): [TextEditor, Selection] | void {
    if (editor === undefined) {
      return cb(`Editor is not active`);
    }

    if (editor.selection === undefined) {
      return cb(`No valid selection`);
    }

    return [editor, editor.selection];
  }
}

// ---------- HELP FUNCTIONS ------------------------------------------
function isImportStatement(selection: string): boolean {
  return /\b(import|export)\b(.|\s)*\bfrom\b/m.test(selection);
}

function sortImportSelection(selection: string, format: SortConfig, options: Options): string {
  return selection.replace(/\{[^.]*?\}/gm, exp => {
    const normalized = exp.trim().replace(/\s+/g, ' ');
    const match = RegExp(/\{(.*?)\}/, 'g').exec(normalized);

    if (match === null || match[1] === undefined) {
      return exp;
    }

    const arrayToSort = match[1].split(',').filter(n => n);
    const sortedArray = sortArray(arrayToSort);

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
    case SortConfig.SingleLine: {
      formattedArray = arr.map((entry, index) => {
        if (index !== 0) {
          entry = ' ' + entry;
        }

        return entry;
      });

      return `{ ${formattedArray} }`;
    }

    case SortConfig.MultiLine: {
      formattedArray = arr.map(entry => {
        entry = '\n' + ' '.repeat(tabWidth) + entry;

        return entry;
      });

      if (trailingComma === true) {
        return `{${formattedArray},\n}`;
      }

      return `{${formattedArray}\n}`;
    }

    case SortConfig.WordGroup: {
      return `{${formatLine(arr, inputPerLine, tabWidth, trailingComma)}\n}`;
    }

    case SortConfig.MaxWidth: {
      return `{\n${formatLineWidth(arr, lineMaxWidth, tabWidth, trailingComma)}\n}`;
    }

    default: {
      return arr.toString();
    }
  }
}

function formatLine(arr: string[], perRow: number, tabWidth: number, trailingComma: boolean) {
  let res: string = '';

  for (let i = 0; i < arr.length; i++) {
    const newRow = i % perRow;

    if (newRow === 0) {
      res += '\n' + ' '.repeat(tabWidth);
    }

    res += arr[i];

    if (i !== arr.length - 1) {
      res += ', ';
    }

    if (i === arr.length - 1 && trailingComma === true) {
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

    if (lineWidth + currentLength > maxWidth && i !== 0) {
      res += '\n' + ' '.repeat(tabWidth);
      lineWidth = tabWidth;
    }

    res += arr[i];

    if (i !== arr.length - 1) {
      res += ', ';
    }

    if (i === arr.length - 1 && trailingComma === true) {
      res += ',';
    }

    lineWidth += currentLength + 2;
  }

  return res;
}
