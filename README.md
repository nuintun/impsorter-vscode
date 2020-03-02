# impsorter-vscode

You might think the structure of your imports are important (_no pun intended_).

This is an extension to help you sort your import statement in an easy convenient way.

## Features

### How to use

`vs-impsorter-extension` supports a number of commands for sorting import statements;

These are acessible via the command menu `(<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>)` and may be bound to keyboard shortcuts in the normal way.

## Available commands

- "Sort Imports: Line import"
- "Sort Imports: One import per line"
- "Sort Imports: Maximum inputs per line"
- "Sort Imports: Limit on max width"

## Change default settings

Open up _settings.json_ and change default settings

```
impsorter.defaultTabWidth: 2
impsorter.trailingComma: false
impsorter.inputPerLine: 2
impsorter.lineMaxWidth: 128
```

### Sort imports on one line selection

![sortLine](https://raw.githubusercontent.com/nuintun/impsorter-vscode/master/assets/vs-impsorter-sortLine.gif)

### Sort imports on regard of maximum line width

![sortLines](https://raw.githubusercontent.com/nuintun/impsorter-vscode/master/assets/vs-importer-sortLinesWidth.gif)

## Release Notes

- Latest changes are referenced in the changelog.

## See [erhise/impsorter](https://github.com/erhise/impsorter)

- Thanks [erhise](https://github.com/erhise)
