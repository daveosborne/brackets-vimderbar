/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror, setTimeout, brackets */

// Open simple dialogs on top of an editor. Relies on dialog.css.
(function () {
    "use strict";
    
    var CommandManager = brackets.getModule("command/CommandManager");
    
    function $dialogDiv(cm, template, option) {
        var $vimderbar = $("#vimderbar");
        return $vimderbar;
    }
    
    CodeMirror.openVimDialog = function (template, shortText, callback, option, cm) {
        if (shortText[0] === "/") {
            // "/" and "?" search used to be integrated with the Vim.js file and
            // the status bar, but I think the native Brackets search is much more
            // efficient. @ff.
            CommandManager.execute("edit.find");
            return;
        }
        var $dialog = $dialogDiv();
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
            if (e.keyCode === 13 || e.keyCode === 27) {
                e.stopPropagation();
                if (e.keyCode === 13) {
                    callback($inp.val());
                    cm.focus();
                }
            }
        });
        $inp.blur(function () {
            // clear the input box on blur
            $inp.val("");
            $inp.hide();
            $dialog.children("#command-sign").text("");
            $dialog.children("#command-info").text("");
            if (!$dialog.children("#confirm").is(":visible")) {
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
    };
  
	CodeMirror.hideVimConfirm = function (callbacks, cm) {
        var $dialog = $dialogDiv();
        $dialog.children("#confirm").hide();
		$dialog.children("#mode").show();
    };
    
    CodeMirror.updateVimDialog = function (mode) {
        var $dialog = $dialogDiv();
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
  
    CodeMirror.updateVimDialogKeys = function (cm, key) {
        var $dialog = $dialogDiv();
        $dialog.children("#command-keys").text(key);
        // not yet implemented. Function is meant to display
        // characters pressed at the far right of the status bar
        // e.g. "13j" should be echoed in "#command-keys" as it is typed 
        // so the user is aware of what he or she has already pressed
    };
}());
