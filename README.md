# Vimderbar
(a play on the German word _wunderbar_)  
is an extension meant to bring vim-like functionality to Adobe's 
[Brackets](http://brackets.io).

![""](http://i.minus.com/icUlXjWzr6m1d.png)

Pretty much all of the Vim keymapping is from 
[CodeMirror](http://codemirror.net)'s /keymap/vim.js, but I modified
things very heavy-handedly. The two files will probably need to 
be maintained in parallel until I can figure out a way to do this
natively in Brackets.

## Installing Vimderbar
0. In the Brackets menu bar, choose **File > Extension Manager...** 
(or click on the "brick" icon in the toolbar).
0. Click the **Install from URL...** button at the bottom.
0. Paste this extension's repo URL 
(https://github.com/fontface/brackets-vimderbar) and click **Install**.
0. Enable Vimderbar via the Brackets menu with **View > Enable Vimderbar**.

## Features
+ Basic vim keybindings (hjkl, yy, dd, p, P, o, O, gg, G, etc.).
+ Search function (`/`) integrated with Brackets' native search.
+ Very basic `:` commands. `:w` saves, `:q` closes the window,
`:e` opens the "Navigate > Quick Open" menu.
+ Modes: Normal, Insert, Visual (Visual-line, too).
+ Vim bar echoes key presses in Normal & Visual modes so the user knows what
has been pressed.
+ Macro functionality restored.

## Limitations
+ `:` commands are sloppy, only one can be performed at a single time.
+ Can't yet perform complex `:` commands (like `:1,8d`)
+ Reverse search (`?`) has been disabled to accommodate the native 
search. (please open an issue if you want this to be restored).
+ Can't yet yank or delete selected text using `yy` or `dd` (doesn't copy to 
clipboard?). Please use `cmd-c`/`ctrl-c` and `cmd-v`/`ctrl-v` instead.
+ Funky indentation (tabs instead of spaces? not sure). 
+ `:` does not yet have "history" (e.g. pressing Up to get previous commands).

## Contributing
Please do, by all means, hack on this extension. For coding conventions,
review the 
[Brackets Coding Conventions]
(https://github.com/adobe/brackets/wiki/Brackets%20Coding%20Conventions).

__Note:__ The Vim.js file isn't my own code, so I have tried to adhere to 
CodeMirror's style.

Thanks!

## Licence
I'd say WTFPL, but the MIT disclaimers are important(see main.js).
