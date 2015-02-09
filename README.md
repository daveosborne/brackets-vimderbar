# Vimderbar
(a play on the German word _wunderbar_)  
is an extension meant to bring vim-like functionality to 
[Brackets](http://brackets.io).

![""](sc.png)

All of the Vim keymapping is from [CodeMirror](http://codemirror.net)'s 
/keymap/vim.js included with Brackets.

## Installing Vimderbar
0. In the Brackets menu bar, choose **File > Extension Manager...** 
(or click on the "brick" icon in the sidebar to the right).
0. Click the **Available** tab and search for **Vimderbar**. Click **Install**.
0. Enable Vimderbar via the Brackets menu with **View > Enable Vimderbar**.

## Features
+ New: Search function (`/`) changed back to CodeMirror search. (Ctrl-F still uses Brackets native search)
+ New: `:vs`, `:sp` and `:on` now hook Brackets split screen functionality
+ New: Add custom keybindings in Preferences with `vimderbar.extraKeys` = [keyMap](http://codemirror.net/doc/manual.html#keymaps)
  + Function based bindings are not supported, as the Preferences are in json.
+ `:` command history per-project or with a common history based on 
`vimderbar.commonHistory` true/false set in brackets preferences.
+ Basic vim keybindings (hjkl, yy, dd, p, P, o, O, gg, G, etc.).
+ Very basic `:` commands. `:w` saves, `:q` closes the document or the inline 
editor in focus, and `:e` opens the "Navigate > Quick Open" menu.
+ Use `:clearHistory` to reset current history.
+ `:bp` and `:bn` implemented for open files, but Document order is different
than what is shown in Working Files.
+ Inline editor support. `Esc` to close an inline editor in Normal mode.
+ Modes: Normal, Insert, Visual (Visual-line, too).
+ Vim bar displays command presses in Normal & Visual modes so the user knows what
has been pressed.
+ Macro functionality restored.

## Limitations
+ `:` is limited to a single command (no :wq).
+ Can't yet perform complex `:` commands (like `:1,8d`).

## Contributing
Please do, by all means, hack on this extension and send me PRs. For coding conventions,
review the 
[Brackets Coding Conventions]
(https://github.com/adobe/brackets/wiki/Brackets%20Coding%20Conventions).

## Changelog
#### 0.7.1
+ changed Vimderbar enable command to 'view.enableVimderbar'
+ cleaned up enable/disable logic and editor switching logic
+ added css to override CodeMirror default colors

Thanks!

## License
See [LICENSE.txt](LICENSE.txt)
