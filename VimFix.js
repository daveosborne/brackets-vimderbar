/*jslint devel: true, nomen: true, indent: 4 */
/*global define, $, CodeMirror, brackets, setTimeout */

// this function's purpose is to make CodeMirror's vim keymap play nice with
// Brackets.
define(function (require, exports, module) {
    "use strict";

    var CodeMirror          = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        CommandManager      = brackets.getModule("command/CommandManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        Commands            = brackets.getModule("command/Commands"),
        cm,
        fecm,
        precm,
        feKeyMap,
        preKeyMap,
        lastFocusedTimeStamp,
        lastTimeStamp,
        vimMode,
        mode,
        changes,
        commandDone;

    // TODO: this is primitive but functional command status
    // this needs to be pushed back to CodeMirror to provide
    // only CodeMirror can parse the commands as typed using the keyMap
    function handleKey(cm, name, event) {
        if (mode === "insert") { return; }
        if (name.match(/Esc|':'/)) {
            cm.clearVimDialogKeys();
            return;
        } else if (name.match(/'y'|'p'|'u'/)) { // these commands don't show up as changes
            cm.clearVimDialogKeys();
            cm.updateVimDialogKeys(name.replace(/'(.)'/, "$1"));
            commandDone = true;
        } else if (!name.match(/Up|Down|Left|Right|End|Home|PageUp|PageDown|Backspace|Delete|Enter|'h'|'j'|'k'|'l'|';'|'t'|'f'|'%'|'$'|'#'|'^'|'{'|'}'|'\['|'\]'|'\('|'\)'/)) {
            if (commandDone) {
                commandDone = false;
                cm.clearVimDialogKeys();
            }
            cm.updateVimDialogKeys(name.replace(/'(.)'/, "$1"));
            if (changes) {
                changes = false;
                commandDone = true;
            }
        }
    }

    function onChanges(cm, changes) {
        changes = true;
    }
    function onModeChange(e) {
        mode = e.mode;
    }
    //function onCommandKey(keys) {
    //    console.log(keys);
    //    cm.updateVimDialogKeys(keys);
    //}

    function attachVimderbar() {
        cm.off("vim-mode-change", onModeChange);
        cm.on("vim-mode-change", onModeChange);
        // vim.js needs new events
        //cm.off("vim-command-keypress", onCommandKey);
        //cm.on("vim-command-keypress", onCommandKey);
        cm.off("beforeChange", onChanges);
        cm.on("beforeChange", onChanges);
        cm.off("keyHandled", handleKey);
        cm.on("keyHandled", handleKey);
    }

    function changeDoc(_cm) {
        cm = _cm;
        attachVimderbar();
    }

    function init(_cm, controller) {
        cm = _cm;
        // todo:
        // 1. fix insert cursor in inline editors. 
        //    (open inline editor in normal mode. press i from within the inline editor.
        //     notice that the cursor remains "fat".) 
        //    fixing this bug will likely fix the visual mode bug described below.

        /**
         ** TODO: solve the inline-editor dilemma
         **/
        var escKeyEvent = function (jqevent, ed, event) {
            if (event.type === "keydown" && event.keyCode === 27) {
                var currentTimeStamp,
                    timeStampDiff;
                if (lastFocusedTimeStamp) {
                    currentTimeStamp = event.timeStamp;
                } else {
                    lastFocusedTimeStamp = currentTimeStamp = event.timeStamp;
                }

                timeStampDiff = currentTimeStamp - lastFocusedTimeStamp;

                // Esc double-tap is set to happen within two fifths of a second
                // otherwise it doesn't register and vimderbar will merely
                // assume that the user is pressing Esc by habit
                if (timeStampDiff === 0 || timeStampDiff >= 400) {
                    // stop the Esc from propagating so the
                    // inline editor doesn't close.
                    CodeMirror.e_stop(event);

                    vimMode = fecm.getOption("keyMap");

                    if (fecm.state.vim) {
                        if (vimMode === "vim-insert" || vimMode === "vim-replace") {
                            CodeMirror.keyMap["vim-insert"].Esc(fecm);
                        } else {
                            CodeMirror.keyMap.vim.Esc(fecm);
                        }
                    }
                } else {
                    // let the Esc event hit the editor.
                    // removing this else block causes double-escapes to
                    // become unresponsive after opening files??
                    return;
                }
                lastFocusedTimeStamp = currentTimeStamp;
            }
        };

        var setVimKeyMap = function (map) {
            var mode;
            fecm.setOption("keyMap", map);
            switch (map) {
            case "vim-insert":
                mode = "insert";
                break;
            case "vim-replace":
                fecm.toggleOverwrite(true);
                mode = "replace";
                break;
            default:
                mode = "normal";
            }
            CodeMirror.signal(fecm, "vim-mode-change", {
                mode: mode
            });
        };

        var changeEditor = function (event, focusedEditor, previousEditor) {
            if (focusedEditor && previousEditor) {
                // make sure focusedEditor and previousEditor exist.
                // this check is to make sure no errors are thrown when
                // a file is opened.
                fecm = focusedEditor._codeMirror;
                precm = previousEditor._codeMirror;

                // get editors so we don't waste resources when user swaps between
                // documents. Only watch if the focused editor is an inline editor
                // or if the focused editor contains inline editors.
                var currentFullEditor = EditorManager.getCurrentFullEditor(),
                    inlineEditors = currentFullEditor.getInlineWidgets();
                // ._visibleRange still the only reliable way to detect whether an
                // editor is inline or not. I'm having a hard time thinking of another
                // way to do this.
                if (focusedEditor._visibleRange || inlineEditors.length !== 0) {
                    feKeyMap = fecm.getOption("keyMap");
                    preKeyMap = precm.getOption("keyMap");

                    // if the keymap isn't one of Vim.js' keymap options, turn the vim on
                    // and set it to the proper mode.
                    if (feKeyMap !== "vim" && feKeyMap !== "vim-insert" && feKeyMap !== "vim-replace") {
                        // enable vim
                        controller.enable(focusedEditor);
                        // force an esc on the editor to get it to act
                        // normally after change.
                        CodeMirror.keyMap.vim.Esc(fecm);
                        // set vim option
                        setVimKeyMap(preKeyMap);
                    }

                    if (precm.state.vim && precm.state.vim.visualMode) {
                        // previous state was "visual" so exit whatever mode currently in
                        // and set to visual
                        if (feKeyMap === "vim-insert" || feKeyMap === "vim-replace") {
                            // exit whatever mode currently in.
                            CodeMirror.keyMap["vim-insert"].Esc(fecm);
                        }

                        CodeMirror.keyMap.vim.Esc(fecm);

                        if (preKeyMap === "vim-insert" || preKeyMap === "vim-replace") {
                            // from the user's perspective, document's vim is in
                            // "insert" or "replace" but the code claims document vim was at
                            // some point in visual mode. i assume it's safe to
                            // override this post-visual setting and just set the editor
                            // to the document's vim mode.
                            setVimKeyMap(preKeyMap);
                        } else {
                            // user was in visual mode before clicking into this editor
                            // so re-enable visual mode if possible.
                            //
                            // known bug: clicking back and forth from inline to full editor
                            //            can sometimes cause the vim bar to state "Normal"
                            //            when in fact the focused inline editor is still in
                            //            visual mode. I don't know how often this bug will
                            //            come up during regular use but it's worth documenting.
                            CodeMirror.keyMap.vim.V(fecm);
                        }
                    } else {
                        if (fecm.state.vim) {
                            if (fecm.state.vim.visualMode === true) {
                                // edge case: current editor is in visual mode, so previous editor
                                // must have been in visual mode too, but now no longer
                                // registers as such, so make fecm exit visual mode in return.
                                CodeMirror.keyMap.vim.Esc(fecm);
                            }
                            // set previous mode to current mode.
                            setVimKeyMap(preKeyMap);
                        }
                    }

                    // detect whether focusedEditor is widget by looking up private
                    // _visibleRange. this is the only reliable way that i've discovered
                    // to check if inline.
                    if (focusedEditor._visibleRange) {
                        // remove then add again so we don't get multiple listeners
                        // for the same event. really piles up after a while.
                        fecm.off("keyEvent", escKeyEvent);
                        fecm.on("keyEvent", escKeyEvent);
                    }
                }
            }
        };

        // init inline editor fix
        $(EditorManager).on("activeEditorChange", changeEditor);
        // add event listener in case user decides to disable vimderbar.
        $(EditorManager).on("vimderbarDisabled", function () {
            $(EditorManager).off("activeEditorChange", changeEditor);
        });

        /**
         ** todo: port Vim.js manual fixes over to this file
         ** & import vim.js from brackets source.
         **/
        CodeMirror.commands.save = function (cm) {
            CommandManager.execute("file.save");
        };
        CodeMirror.commands.close = function (cm) {
            var hostEditor = EditorManager.getCurrentFullEditor(),
                inlineFocused = EditorManager.getFocusedInlineWidget();
            if (inlineFocused) {
                // inline editor exists & is in focus. close it.
                EditorManager.closeInlineWidget(hostEditor, inlineFocused);
            } else {
                // no inline editor is in focus so just close the document.
                CommandManager.execute("file.close");
            }
        };
        CodeMirror.commands.open = function (cm) {
            setTimeout(function () {
                CommandManager.execute("navigate.quickOpen");
            }, 200);
            // used to be "file.open" because quickOpen would automatically close
            // following the user's push of Enter key to submit Open command (":e[Enter]")
            // setTimeout meant to give the user a moment to let go of the Enter key.
        };
        CodeMirror.Vim.defineEx("quit", "q", function (cm) {
            cm.focus();
            CodeMirror.commands.close(cm);
        });
        CodeMirror.Vim.defineEx("edit", "e", function (cm) {
            CodeMirror.commands.open(cm);
        });
        CodeMirror.Vim.defineEx("write", "w", function (cm) {
            CodeMirror.commands.save(cm);
        });
        CodeMirror.Vim.defineEx("bnext", "bn", function (cm) {
            var file = DocumentManager.getNextPrevFile(1);
            CommandManager.execute(Commands.FILE_OPEN, {
                fullPath: file.fullPath
            });
            cm.focus();
        });
        CodeMirror.Vim.defineEx("bprev", "bp", function (cm) {
            var file = DocumentManager.getNextPrevFile(-1);
            CommandManager.execute(Commands.FILE_OPEN, {
                fullPath: file.fullPath
            });
            cm.focus();
        });
    }
    exports.init = init;
    exports.changeDoc = changeDoc;
    exports.attachVimderbar = attachVimderbar;
});

