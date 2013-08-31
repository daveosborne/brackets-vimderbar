/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror, setTimeout, brackets */

// Open simple dialogs on top of an editor. Relies on dialog.css.
(function () {
    "use strict";
    
    var CommandManager = brackets.getModule("command/CommandManager"),
        EditorManager = brackets.getModule("editor/EditorManager");
    
    function $dialogDiv(cm, template, option) {
        var $vimderbar = $("#vimderbar");
        return $vimderbar;
    }
    
    CodeMirror.openVimDialog = function (template, shortText, callback, options, cm) {
        var $dialog = $dialogDiv();
        if (shortText === null) { // dealing with Macros
            $dialog.children("#mode").html(template);
            return function (closing) {
                if (closing) {
                    return false;
                } else {
                    return true;
                }
            };
        } else if (shortText[0] === "/") {
            // "/" and "?" search used to be integrated with the Vim.js file and
            // the status bar, but I think the native Brackets search is much more
            // efficient. @ff.
            CommandManager.execute("edit.find");
            return;
        }
        var closed = false, me = this;
        function close() {
            if (closed) {
                return;
            }
            closed = true;
            // dialog.something;
        }
        var $inp = $dialog.children("#command");
        $inp.show();
        $inp.focus();
        $dialog.children("#command-sign").text(shortText[0]);
        // $dialog.children("#command-info").text(template.commandInfo); // deprecated?
        $dialog.children("#mode").hide();
		$dialog.children("#confirm").hide();
        $inp.bind("keydown", function (e) {
            var keyName = CodeMirror.keyName(e);
            if (e.keyCode === 13 || keyName === "Enter") {
                CodeMirror.e_stop(e);
                var commandVal = $inp.val();
                if (cm.hasOwnProperty("focus")) {
                    cm.focus();
                } else {
                    $inp.blur();
                }
                callback(commandVal);
            } else if (keyName === "Esc" || keyName === "Ctrl-C" || keyName === "Ctrl-[") {
                CodeMirror.e_stop(e);
				cm.focus();
            }
        });
        $inp.blur(function () {
            // clear the input box on blur
            $inp.val("");
            $inp.hide();
            $dialog.children("#command-sign").text("");
            $dialog.children("#command-info").text("");
            if (!$dialog.children("#confirm").is(":visible")) { // if #confirm hidden, show mode
				$dialog.children("#mode").show();
            }
        });
        return close;
    };
    
    CodeMirror.openVimConfirm = function (template, callbacks, option, cm) {
        var $dialog = $dialogDiv();
		$dialog.children("#confirm").show();
        $dialog.children("#confirm").text(template);
        $dialog.children("#mode").hide();
        cm.focus();
    };
  
	CodeMirror.hideVimConfirm = function (callbacks, cm) {
        var $dialog = $dialogDiv();
        $dialog.children("#confirm").hide();
		$dialog.children("#mode").show();
    };
    
    CodeMirror.updateVimDialog = function (mode) {
        var $dialog = $dialogDiv();
        $dialog.children("#mode").show();
		$dialog.children("#confirm").hide();
        $dialog.children("#mode").text("-- " + mode + " --");
    };
    
    CodeMirror.processVimSearch = function (prev, repeat) {
        var i;
        if (repeat === undefined) { repeat = 1; }
        if (prev === true) {
            // user issued a "previous" command (N)
            for (i = 0; i < repeat; i++) {
                CommandManager.execute("edit.findPrevious");
            }
        } else {
            // user issued a "next" command (n)
            for (i = 0; i < repeat; i++) {
                CommandManager.execute("edit.findNext");
            }
        }
    };
  
    CodeMirror.updateVimDialogKeys = function (key, cm) {
        if (key === "?") {
            return;
        }
        var $dialog = $dialogDiv();
        $dialog.children("#command-keys").append(key);
        // Function is meant to display
        // characters pressed at the far right of the status bar
        // e.g. "13j" should be echoed in "#command-keys" as it is typed 
        // so the user is aware of what he or she is pressing
    };
    
    CodeMirror.clearVimDialogKeys = function () {
        var $dialog = $dialogDiv();
        $dialog.children("#command-keys").text("");
    };
    
    CodeMirror.watchVimMode = function (cm) {
        if (cm === undefined) {
            cm = EditorManager.getCurrentFullEditor()._codeMirror;
        }
        cm.on("vim-mode-change", function (event) {
            var mode = event.mode;
            CodeMirror.updateVimDialog(mode);
        });
    };
}());
