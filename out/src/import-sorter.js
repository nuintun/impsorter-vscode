"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
var SortConfig;
(function (SortConfig) {
    SortConfig[SortConfig["SingleLine"] = 0] = "SingleLine";
    SortConfig[SortConfig["MultiLine"] = 1] = "MultiLine";
    SortConfig[SortConfig["WordGroup"] = 2] = "WordGroup";
    SortConfig[SortConfig["MaxWidth"] = 3] = "MaxWidth";
})(SortConfig || (SortConfig = {}));
class ImportSorter {
    constructor(config) {
        this.config = config;
        this.defaultTabWidth = this.config.defaultTabWidth;
        this.trailingComma = this.config.trailingComma;
        this.inputPerLine = this.config.inputPerLine;
        this.lineMaxWidth = this.config.lineMaxWidth;
    }
    // extension.sortImportLine
    sortImportLine() {
        this.handleSorting(SortConfig.SingleLine);
    }
    sortImportsPerLine() {
        this.handleSorting(SortConfig.MultiLine);
    }
    // extension.sortImportLinesOnWordGroupingCommand
    sortImportLinesOnWordGroupingCommand() {
        this.handleSorting(SortConfig.WordGroup);
    }
    // extension.sortImportLinesOnMaxCharWidthCommand
    sortImportLinesOnMaxCharWidthCommand() {
        this.handleSorting(SortConfig.MaxWidth);
    }
    // TODO: break up to not handle messaging
    handleSorting(format) {
        const activeEditor = this.checkEditorAndSelection(vscode_1.window.activeTextEditor, (error) => vscode_1.window.showErrorMessage(error));
        if (activeEditor) {
            const [editor, selection] = activeEditor;
            const selectionEndLine = editor.document.lineAt(selection.end.line);
            const range = new vscode_1.Range(selection.start.line, 0, selection.end.line, selectionEndLine.range.end.character);
            const input = editor.document.getText(range);
            if (isImportStatement(input)) {
                const config = {
                    tabWidth: this.defaultTabWidth,
                    trailingComma: this.trailingComma,
                    inputPerLine: this.inputPerLine,
                    lineMaxWidth: this.lineMaxWidth
                };
                const sortedImport = sortImportSelection(input, format, config);
                editor.edit(builder => builder.replace(range, sortedImport));
                vscode_1.window.showInformationMessage(`${selection.end.line - selection.start.line + 1} number of lines got sorted.`);
            }
            else {
                vscode_1.window.showErrorMessage(`Selection does not seem to contain import statement`);
            }
        }
    }
    // Make sure editor is active and that there is a selection.
    checkEditorAndSelection(editor, cb) {
        if (!editor) {
            return cb(`Editor is not active`);
        }
        if (!editor.selection) {
            return cb(`No valid selection`);
        }
        return [editor, editor.selection];
    }
}
exports.ImportSorter = ImportSorter;
function isImportStatement(selection) {
    return /\b(import|export)\b(.|\s)*\bfrom\b/m.test(selection);
}
function sortImportSelection(selection, format, options) {
    return selection
        .trim()
        .replace(/(\s)+/gm, '$1')
        .replace(/\{[^.]*?\}/gm, exp => {
        const match = /\{(.*?)\}/gm.exec(exp);
        if (!match || !match[1])
            return exp;
        const arrayToSort = match[1].split(',').filter(n => n);
        const sortedArray = sortArray(arrayToSort.map(n => n.trim()));
        return formatArray(sortedArray, format, options);
    });
}
function sortArray(arr) {
    return arr.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}
function formatArray(arr, format, options) {
    const { tabWidth, trailingComma, inputPerLine, lineMaxWidth } = options;
    let formattedArray;
    switch (format) {
        case SortConfig.SingleLine:
            formattedArray = arr.map((entry, index) => (index !== 0 ? ` ${entry}` : entry));
            return `{ ${formattedArray} }`;
        case SortConfig.MultiLine:
            formattedArray = arr.map(entry => `\n${' '.repeat(tabWidth)}${entry}`);
            if (trailingComma)
                return `{${formattedArray},\n}`;
            return `{${formattedArray}\n}`;
        case SortConfig.WordGroup:
            return `{${formatLine(arr, inputPerLine, tabWidth, trailingComma)}\n}`;
        case SortConfig.MaxWidth:
            return `{\n${formatLineWidth(arr, lineMaxWidth, tabWidth, trailingComma)}\n}`;
        default:
            return arr.toString();
    }
}
function formatLine(arr, perRow, tabWidth, trailingComma) {
    let res = '';
    for (let i = 0; i < arr.length; i++) {
        const newRow = i % perRow;
        if (newRow === 0) {
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
function formatLineWidth(arr, maxWidth, tabWidth, trailingComma) {
    let lineWidth = tabWidth;
    let res = ' '.repeat(tabWidth);
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
//# sourceMappingURL=import-sorter.js.map