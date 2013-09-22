# Vimderbar
(a play on the German word _wunderbar_)  
is an extension meant to bring vim-like functionality to 
[Brackets](http://brackets.io).

![""](http://i.minus.com/ibodq0DYcbsoYp.png)

Pretty much all of the Vim keymapping is from 
[CodeMirror](http://codemirror.net)'s /keymap/vim.js, but I modified
things very heavy-handedly. The two files will probably need to 
be maintained in parallel until I can figure out a way to do this
natively in Brackets.

## Installing Vimderbar
0. In the Brackets menu bar, choose **File > Extension Manager...** 
(or click on the "brick" icon in the sidebar to the right).
0. Click the **Available** tab and search for **Vimderbar**. Click **Install**.
0. Enable Vimderbar via the Brackets menu with **View > Enable Vimderbar**.

## Features
+ Basic vim keybindings (hjkl, yy, dd, p, P, o, O, gg, G, etc.).
+ Search function (`/`) integrated with Brackets' native search.
+ Very basic `:` commands. `:w` saves, `:q` closes the document or the inline 
editor in focus, and `:e` opens the "Navigate > Quick Open" menu.
+ Inline editor support. Double-tap `Esc` to close an inline editor. 
+ Modes: Normal, Insert, Visual (Visual-line, too).
+ Vim bar displays command presses in Normal & Visual modes so the user knows what
has been pressed.
+ Macro functionality restored.

## Limitations
+ `:` commands are sloppy, only one can be performed at a single time.
+ Can't yet perform complex `:` commands (like `:1,8d` or even `:wq`).
+ `:` does not yet have "history" (e.g. pressing Up to get previous commands).
+ Reverse search (`?`) has been disabled to accommodate the native 
search. (Please open an issue if you want this to be restored.)

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
