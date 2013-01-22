# Vimderbar
(a play on the German word _wunderbar_)  
is an extension meant to bring vim-like functionality to Adobe's 
[Brackets](://www.brackets.io).

![""](http://i.minus.com/icUlXjWzr6m1d.png)

Pretty much all of the Vim keymapping is from 
[CodeMirror](://www.codemirror.net)'s /keymap/vim.js, but I modified
things very heavy-handedly. The two files will probably need to 
be maintained in parallel until I can figure out a way to do this
natively in Brackets.

## Installing Vimderbar
0. Download the Vimderbar extension ("brackets-vimderbar") 
folder.
0. Run Brackets. 
0. In the menu bar, navigate to 
"Help > Show Extensions Folder".
0. Place the previously downloaded "brackets-vimderbar" 
folder into the "user" directory (you can delete this README file 
if you'd like).
0. Restart Brackets.
0. Enable Vimderbar via Brackets' menu with "View > Enable Vimderbar".

## Features
+ Basic vim keybindings (hjkl, yy, dd, p, P, o, O, gg, G, etc.).
+ Search function (`/`) integrated with Brackets' native search.
+ Very basic `:` commands. `:w` saves, `:q` closes the window,
`:e` opens the "File > Open..." menu.
+ Modes: Normal, Insert, Visual (Visual-line, too).

## Limitations
+ `:` commands are sloppy, only one can be performed at a single time.
+ Can't yet perform complex `:` commands (like `:1,8d`)
+ Reverse search (`?`) has been disabled to accommodate the native 
search.
+ Visual mode selection is kind of broken (visual line mode 
seems to work fine).
+ Can't yet yank or delete selected text using `yy` or `dd`. 
Please use `cmd-c`/`ctrl-c` and `cmd-v`/`ctrl-v` instead.
+ Saving with `:w` can cause the cursor to jump to a higher part of the 
file (inconsistently observed).
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
