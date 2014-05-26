/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, setTimeout, brackets */

// Open simple dialogs on top of an editor. Relies on dialog.css.
define(function (require, exports, module) {
    "use strict";
    
    var CommandManager = brackets.getModule("command/CommandManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        CodeMirror;
    
    var cm, callback;
    var $dialog, $inp;

    function init(CM) {
        CodeMirror = CM;
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
        
        CodeMirror.openVimDialog = function (template, shortText, _callback, options, _cm) {
            cm = _cm;
            callback = _callback;
            if (shortText === null) { // dealing with Macros
                $dialog.children("#mode").html(template);
                return function (closing) {
                    if (closing) {
                        return false;
                    }
                    
                    return true;
                };
            }
            
            if (shortText[0] === "/") {
                // "/" and "?" search used to be integrated with the Vim.js file and
                // the status bar, but I think the native Brackets search is much more
                // efficient. @ff.
                CommandManager.execute("cmd.find");
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
            $inp.show();
            $inp.focus();
            $dialog.children("#command-sign").text(shortText[0]);
            // $dialog.children("#command-info").text(template.commandInfo); // deprecated?
            $dialog.children("#mode").hide();
            $dialog.children("#confirm").hide();
            return close;
        };
        
        CodeMirror.openVimConfirm = function (template, callbacks, option, cm) {
            $dialog.children("#confirm").show();
            $dialog.children("#confirm").text(template);
            $dialog.children("#mode").hide();
            cm.focus();
        };
      
        CodeMirror.hideVimConfirm = function (callbacks, cm) {
            $dialog.children("#confirm").hide();
            $dialog.children("#mode").show();
        };
        
        CodeMirror.updateVimDialog = function (mode) {
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
                    CommandManager.execute("cmd.findPrevious");
                }
            } else {
                // user issued a "next" command (n)
                for (i = 0; i < repeat; i++) {
                    CommandManager.execute("cmd.findNext");
                }
            }
        };
      
        CodeMirror.updateVimDialogKeys = function (key, cm) {
            if (key === "?") {
                return;
            }
            $dialog.children("#command-keys").append(key);
            // Function is meant to display
            // characters pressed at the far right of the status bar
            // e.g. "13j" should be echoed in "#command-keys" as it is typed 
            // so the user is aware of what he or she is pressing
        };
        
        CodeMirror.clearVimDialogKeys = function () {
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
    }
    
    exports.init = init;
});
