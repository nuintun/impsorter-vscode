"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const import_sorter_1 = require("./import-sorter");
const vscode_1 = require("vscode");
function activate(ctx) {
    const config = vscode_1.workspace.getConfiguration('impsorter');
    const importSorter = new import_sorter_1.ImportSorter(config);
    ctx.subscriptions.push(vscode_1.commands.registerCommand('extension.sortImportLine', () => {
        importSorter.sortImportLine();
    }));
    ctx.subscriptions.push(vscode_1.commands.registerCommand('extension.sortImportsPerLine', () => {
        importSorter.sortImportsPerLine();
    }));
    ctx.subscriptions.push(vscode_1.commands.registerCommand('extension.sortImportLinesOnWordGrouping', () => {
        importSorter.sortImportLinesOnWordGroupingCommand();
    }));
    ctx.subscriptions.push(vscode_1.commands.registerCommand('extension.sortImportLinesOnMaxCharWidth', () => {
        importSorter.sortImportLinesOnMaxCharWidthCommand();
    }));
}
exports.activate = activate;
// this method is called when extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map