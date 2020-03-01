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
        this.defaultTabWidth = this.config.defaultTabWidth;
        this.trailingComma = this.config.trailingComma;
        this.inputPerLine = this.config.inputPerLine;
        this.lineMaxWidth = this.config.lineMaxWidth;
        this.config = config;
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
        const activeEditor = this.checkEditorAndSelection(vscode_1.window.activeTextEditor, (error) => {
            vscode_1.window.showErrorMessage(error);
            return;
        });
        if (activeEditor !== undefined) {
            const [editor, selection] = activeEditor;
            const selectionEndLine = editor.document.lineAt(selection.end.line);
            const range = new vscode_1.Range(selection.start.line, 0, selection.end.line, selectionEndLine.range.end.character);
            const input = editor.document.getText(range);
            if (!isImportStatement(input)) {
                vscode_1.window.showErrorMessage(`Selection does not seem to contain import statement`);
                return;
            }
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
    }
    // Make sure editor is active and that there is a selection.
    checkEditorAndSelection(editor, cb) {
        if (editor === undefined) {
            return cb(`Editor is not active`);
        }
        if (editor.selection === undefined) {
            return cb(`No valid selection`);
        }
        return [editor, editor.selection];
    }
}
exports.ImportSorter = ImportSorter;
// ---------- HELP FUNCTIONS ------------------------------------------
function isImportStatement(selection) {
    return /\b(import|export)\b(.|\s)*\bfrom\b/m.test(selection);
}
function sortImportSelection(selection, format, options) {
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
function sortArray(arr) {
    return arr.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}
function formatArray(arr, format, options) {
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
function formatLine(arr, perRow, tabWidth, trailingComma) {
    let res = '';
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
function formatLineWidth(arr, maxWidth, tabWidth, trailingComma) {
    let lineWidth = tabWidth;
    let res = ' '.repeat(tabWidth);
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
//# sourceMappingURL=import-sorter.js.map