/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror, setTimeout, brackets, Mustache */

// Open simple dialogs on top of an editor. Relies on dialog.css.
define(function (require, exports, module) {
    "use strict";
    
    var CommandManager = brackets.getModule("command/CommandManager"),
        EditorManager  = brackets.getModule("editor/EditorManager"),
        CodeMirror     = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");
    
    var cm, callback;
    var $dialog, $inp;

    var openVimDialog = function (template, callback, options) {
        var shortText = $(Mustache.render(template))[0].html();
        console.log(shortText);
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
        var closed = false;
        function close() {
            if (closed) {
                return;
            }
            closed = true;
            // dialog.something;
        }
        $inp.show();
        $inp.focus();
        $dialog.children("#command-sign").text(shortText[0]);
        // $dialog.children("#command-info").text(template.commandInfo); // deprecated?
        $dialog.children("#mode").hide();
        $dialog.children("#confirm").hide();
        return close;
    };
    var openVimConfirm = function (template, callbacks, option, cm) {
        $dialog.children("#confirm").show();
        $dialog.children("#confirm").text(template);
        $dialog.children("#mode").hide();
        cm.focus();
    };
    var hideVimConfirm = function (callbacks, cm) {
        $dialog.children("#confirm").hide();
        $dialog.children("#mode").show();
    };
    var updateVimDialog = function (mode) {
        $dialog.children("#mode").show();
        $dialog.children("#confirm").hide();
        $dialog.children("#mode").text("-- " + mode + " --");
    };
    var processVimSearch = function (prev, repeat) {
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
    var updateVimDialogKeys = function (key, cm) {
        if (key === "?") {
            return;
        }
        $dialog.children("#command-keys").append(key);
        // Function is meant to display
        // characters pressed at the far right of the status bar
        // e.g. "13j" should be echoed in "#command-keys" as it is typed 
        // so the user is aware of what he or she is pressing
    };
    var clearVimDialogKeys = function () {
        $dialog.children("#command-keys").text("");
    };
    var watchVimMode = function (cm) {
        if (cm === undefined) {
            cm = EditorManager.getCurrentFullEditor()._codeMirror;
        }
        cm.on("vim-mode-change", function (event) {
            var mode = event.mode;
            CodeMirror.updateVimDialog(mode);
        });
    };
    var init = function () {
        $dialog = $("#vimderbar");
        $inp = $dialog.children("#command");
        $inp.on("keydown", function (e) {
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
        $inp.on("blur", function () {
            $inp.val("");
            $inp.hide();
            $dialog.children("#command-sign").text("");
            $dialog.children("#command-info").text("");
            if (!$dialog.children("#confirm").is(":visible")) { // if #confirm hidden, show mode
                $dialog.children("#mode").show();
            }
        });

    };
    
    CodeMirror.defineExtension("openDialog", openVimDialog);
	CodeMirror.defineExtension("updateVimDialog", updateVimDialog);
    CodeMirror.defineExtension("updateVimDialogKeys", updateVimDialogKeys);
    console.log(CodeMirror.openDialog);
    exports.init = init;
});
