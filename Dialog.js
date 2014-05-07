/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, CodeMirror, setTimeout, brackets, Mustache */

// Open simple dialogs on top of an editor. Relies on dialog.css.
define(function (require, exports, module) {
    "use strict";

    var CommandManager = brackets.getModule("command/CommandManager"),
        EditorManager  = brackets.getModule("editor/EditorManager"),
        CodeMirror     = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");

    var cm, callback;
    var $dialog, $input;

    var attachVimderbar = function() {
        cm.openDialog = openVimDialog;
        cm.updateVimDialog = updateVimDialog;
        cm.clearVimDialogKeys = clearVimDialogKeys;
        cm.updateVimDialogKeys = updateVimDialogKeys;
        cm.watchVimMode = watchVimMode;
    };

    var changeDoc = function(_cm) {
        cm = _cm;
        attachVimderbar();
    };

    var openVimDialog = function (template, _callback, options) {
        callback = _callback;
        // grab shortText out of the provided template
        var shortText = $(Mustache.render(template))[0].innerHTML;
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
        $input.show();
        $input.focus();
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
        if ($dialog) {
            $dialog.children("#mode").show();
            $dialog.children("#confirm").hide();
            $dialog.children("#mode").text("-- " + mode + " --");
        }
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
        if (cm) {
            cm.on("vim-mode-change", function (event) {
                var mode = event.mode;
                CodeMirror.updateVimDialog(mode);
            });
        }
    };
    var init = function (_cm) {
        cm = _cm;
        $dialog = $("#vimderbar");
        $input = $dialog.children("#command");
        $input.on("keydown", function (e) {
            var keyName = CodeMirror.keyName(e);
            if (e.keyCode === 13 || keyName === "Enter") {
                CodeMirror.e_stop(e);
                var commandVal = $input.val();
                if (cm.hasOwnProperty("focus")) {
                    cm.focus();
                } else {
                    $input.blur();
                }
                console.log(callback);
                callback(commandVal);
            } else if (keyName === "Esc" || keyName === "Ctrl-C" || keyName === "Ctrl-[") {
                CodeMirror.e_stop(e);
                cm.focus();
            }
        });
        $input.on("blur", function () {
            $input.val("");
            $input.hide();
            $dialog.children("#command-sign").text("");
            $dialog.children("#command-info").text("");
            if (!$dialog.children("#confirm").is(":visible")) { // if #confirm hidden, show mode
                $dialog.children("#mode").show();
            }
        });
        attachVimderbar();
    };
    CodeMirror.openDialog = openVimDialog;
    CodeMirror.updateVimDialog = updateVimDialog;
    CodeMirror.clearVimDialogKeys = clearVimDialogKeys;
    CodeMirror.updateVimDialogKeys = updateVimDialogKeys;
    CodeMirror.watchVimMode = watchVimMode;

    exports.init = init;
    exports.changeDoc = changeDoc;
});

