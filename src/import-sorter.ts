import { Range, Selection, TextEditor, TextLine, window, WorkspaceConfiguration } from 'vscode';

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
  private defaultTabWidth: number = this.config.defaultTabWidth;
  private trailingComma: boolean = this.config.trailingComma;
  private inputPerLine: number = this.config.inputPerLine;
  private lineMaxWidth: number = this.config.lineMaxWidth;

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
    const activeEditor: void | [TextEditor, Selection] = this.checkEditorAndSelection(
      window.activeTextEditor,
      (error: string) => window.showErrorMessage(error)
    );

    if (activeEditor) {
      const [editor, selection]: [TextEditor, Selection] = activeEditor;
      const selectionEndLine: TextLine = editor.document.lineAt(selection.end.line);

      const range: Range = new Range(selection.start.line, 0, selection.end.line, selectionEndLine.range.end.character);
      const input: string = editor.document.getText(range);

      if (isImportStatement(input)) {
        const config: Options = {
          tabWidth: this.defaultTabWidth,
          trailingComma: this.trailingComma,
          inputPerLine: this.inputPerLine,
          lineMaxWidth: this.lineMaxWidth
        };
        const sortedImport: string = sortImportSelection(input, format, config);

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

const MODULE_RE: RegExp = /(?:import|export)\s+?(?:(?:(?:[\w*\s{},]*)\s+from\s+?)|)(?:(?:".*?")|(?:'.*?'))[\s]*?(?:;|$|)/gm;

function isImportStatement(selection: string): boolean {
  return MODULE_RE.test(selection);
}

function sortImportSelection(selection: string, format: SortConfig, options: Options): string {
  return selection.replace(MODULE_RE, match =>
    match
      .replace(/[ ]+/gm, ' ')
      .replace(/[\r\n]/gm, '')
      .replace(/\{[^.]*?\}/gm, words => {
        const match: RegExpExecArray | null = /\{(.*?)\}/gm.exec(words);

        if (!match || !match[1]) return words;

        const arrayToSort: string[] = match[1].split(',').filter(n => n);
        const sortedArray: string[] = sortArray(arrayToSort.map(n => n.trim()));

        return formatArray(sortedArray, format, options);
      })
  );
}

function sortArray(arr: string[]): string[] {
  return arr.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

function formatArray(arr: string[], format: SortConfig, options: Options): string {
  const { tabWidth, trailingComma, inputPerLine, lineMaxWidth }: Options = options;

  let formattedArray: string[];

  switch (format) {
    case SortConfig.SingleLine:
      formattedArray = arr.map((entry, index) => (index > 0 ? ` ${entry}` : entry));

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

  const arrLen: number = arr.length;
  const lastIndex: number = arrLen - 1;

  for (let i: number = 0; i < arrLen; i++) {
    const newRow: number = i % perRow;

    if (!newRow) {
      res += `\n${' '.repeat(tabWidth)}`;
    }

    res += arr[i];

    if (i !== lastIndex) {
      res += ', ';
    }

    if (i === lastIndex && trailingComma) {
      res += ',';
    }
  }

  return res;
}

function formatLineWidth(arr: string[], maxWidth: number, tabWidth: number, trailingComma: boolean) {
  let lineWidth: number = tabWidth;
  let res: string = ' '.repeat(tabWidth);

  const arrLen: number = arr.length;
  const lastIndex: number = arrLen - 1;

  for (let i: number = 0; i < arrLen; i++) {
    const currentLength: number = arr[i].length;

    if (i > 0 && lineWidth + currentLength > maxWidth) {
      lineWidth = tabWidth;
      res += `\n${' '.repeat(tabWidth)}`;
    }

    res += arr[i];

    if (i !== lastIndex) {
      res += ', ';
    }

    if (i === lastIndex && trailingComma) {
      res += ',';
    }

    lineWidth += currentLength + 2;
  }

  return res;
}
