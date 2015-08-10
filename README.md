# Vimderbar
(a play on the German word _wunderbar_) is an extension meant to bring vim-like functionality to [Brackets](http://brackets.io).

![""](sc.png)

All of the Vim keymapping is from [CodeMirror](http://codemirror.net)'s `keymap/vim.js`.

## Installing Vimderbar
0. In the Brackets menu bar, choose **File > Extension Manager...** (or click on the "brick" icon in the sidebar to the right).
0. Click the **Available** tab and search for **Vimderbar**. Click **Install**.
0. Enable Vimderbar via the Brackets menu with **View > Enable Vimderbar**.

## Configuration

### Keybindings
+ Add custom keybindings in Brackets preferences with `vimderbar.mappings: [maps]`
  + format of map: {"keys": "", "toKeys": "", "mode": ""}
  + mode is one of insert, visual, normal

### Command Mode History
+ Default history is per-project, enable common history in Brackets preferences with `vimderbar.commonHistory: true`

### Switch Panes Override
+ Bind `"view.toggleActivePane"` in your overrides keymap.json to switch panes
  
## Features
+ `:vs`, `:sp` and `:on` hook Brackets split screen functionality.
+ Basic vim keybindings (`hjkl`, `yy`, `dd`, `p`, `P`, `o`, `O`, `gg`, `G`, etc).
+ Very basic `:` commands. `:w` saves, `:q` closes the document or the inline editor in focus, and `:e` opens the "Navigate > Quick Open" menu.
+ `:bp` and `:bn` implemented for open files, but Document order is different than what is shown in Working Files (uses)
+ Inline editor support, `Esc` closes inline editor when in Normal mode.
+ Use `:clearHistory` to reset current history.

## Limitations
+ Command Mode doesn't support chained commands (no `:wq`).
+ Can't perform complex commands (like `:1,8d`).

## License
See [LICENSE.txt](LICENSE.txt)

## Changelog

### 0.11.1
+ Changed switch pane to use Brackets keymap

### 0.11.0
+ Added binding for switching active pane in split mode
  + Overrides default File->Close shortcut

### 0.10.0
+ Replaced vimderbar.extraKeys in preferences with vimderbar.mappings
  + Now uses CodeMirror.Vim.map() for key mappings

### 0.9.0
+ Now restricts code hinting to input mode (Issue #41)

### 0.8.1
+ Fix macro functionality, openDialog now handles entering macro mode (Issue #38)

### 0.8.0
+ Fix esc key handling code to work with Brackets 1.2 preview (Issue #36)
+ Reorganize modules and file tree
+ Refactor event handling and initialization
+ Fix deprecated event syntax

### 0.7.2
+ Removed some bad console output
+ Cleanup README

### 0.7.1
+ Changed Vimderbar enable command to 'view.enableVimderbar'
+ Cleaned up enable/disable logic and editor switching logic
+ Added css to override CodeMirror default colors

## Contributing
Please do, by all means, hack on this extension and send me PRs. For coding conventions, review the [Brackets Coding Conventions](https://github.com/adobe/brackets/wiki/Brackets%20Coding%20Conventions).

Thanks!
