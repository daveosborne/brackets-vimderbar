/* jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/* global define, $, brackets, setTimeout */

// this function's purpose is to make CodeMirror's vim keymap play nice with
// Brackets.
define(function (require, exports) {
    "use strict";

    var CodeMirror      = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
        CommandManager  = brackets.getModule("command/CommandManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        Commands        = brackets.getModule("command/Commands"),
        CommandDialog,
        cm,
        fecm,
        precm,
        vimMode,
        controller,
        commandDone;

    /**
     * Initialize Vim fixes for CodeMirror -> Brackets integration.
     * @param {CodeMirror} _cm Current CodeMirror instance.
     * @param {CommandDialog} _CommandDialog Current CommandDialog instance.
     * @param {Object} _controller Vim enable/disable controller functions.
     */
    function init(_cm, _CommandDialog, _controller) {
        CommandDialog = _CommandDialog;
        cm = _cm;
        controller = _controller;
        
        // CodeMirror -> Brackets Command Hooks
        CodeMirror.commands.save = function () {
            CommandManager.execute("file.save");
        };
        CodeMirror.commands.close = function () {
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
        CodeMirror.commands.open = function () {
            // used to be "file.open" because quickOpen would automatically close
            // following the user's push of Enter key to submit Open command (":e[Enter]")
            // setTimeout meant to give the user a moment to let go of the Enter key.
            setTimeout(function () {
                CommandManager.execute("navigate.quickOpen");
            }, 150);
        };
        
        // init inline editor fix
        $(EditorManager).on("activeEditorChange", changeEditor);
        // add event listener in case user decides to disable vimderbar.
        $(EditorManager).on("vimderbarDisabled", function () {
            $(EditorManager).off("activeEditorChange", changeEditor);
        });
        
        // Ex Command Definitions
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
            CommandManager.execute(Commands.FILE_OPEN, { fullPath: file.fullPath });
            cm.focus();
        });
        CodeMirror.Vim.defineEx("bprev", "bp", function (cm) {
            var file = DocumentManager.getNextPrevFile(-1);
            CommandManager.execute(Commands.FILE_OPEN, { fullPath: file.fullPath });
            cm.focus();
        });
        CodeMirror.Vim.defineEx("clearhistory", "clearhistory", function (cm) {
            CommandDialog.resetHistory();
            cm.focus();
        });
    }
    /**
     * @private
     * Handler for CodeMirror's vim.js vim-keypress event. Filters and updates keys, clears commands when next command input.
     * @param {String} key Key pressed.
     */
    function _onKeypress(key) {
        // fix broken '/' search by calling cmd.find
        if (key === '/') { CommandManager.execute("cmd.find"); }
        // prevent esc from being displayed or clearing the dialog keys
        if (key.match(/Esc/)) { return; }
        if (!key.match(/:|h|j|k|l|;/)) {
            if (commandDone) {
                cm.clearVimCommandKeys();
                commandDone = false;
            }
            cm.updateVimCommandKeys(key);
        }
    }
    /**
     * @private
     * Handler for CodeMirror's vim.js vim-command-done event. Sets commandDone so current command is cleared on next keypress.
     */
    function _onCommandDone() {
        commandDone = true;
    }
    /**
     * Attach events to current CodeMirror instance.
     * @param {CodeMirror} cm Current CodeMirror instance.
     */
    function attachVimderbar(cm) {
        cm.off("vim-keypress", _onKeypress);
        cm.on("vim-keypress", _onKeypress);
        cm.off("vim-command-done", _onCommandDone);
        cm.on("vim-command-done", _onCommandDone);
    }
    /**
     * Change current document, attach events to new editor.
     * @param {CodeMirror} cm CodeMirror instance to attach to.
     */
    function changeDocument(cm) {
        attachVimderbar(cm);
    }
    // TODO: fix insert cursor in inline editors. 
    //    (open inline editor in normal mode. press i from within the inline editor.
    //     notice that the cursor remains "fat".) 
    //    fixing this bug will likely fix the visual mode bug described below.

    // TODO: solve the inline-editor dilemma
    /**
     * @private
     * Close inline editor when esc is pressed outside of insert/replace mode.
     * @param {CodeMirror} cm Current CodeMirror instance. Unused.
     * @param {jQuery.Event} e KeyEvent event object.
     */
    function _escKeyEvent(cm, e) {
        if (e.keyCode === 27) {
            CodeMirror.e_stop(e);

            vimMode = fecm.getOption("keyMap");

            if (fecm.state.vim) {
                if (fecm.state.vim && fecm.state.vim.visualMode) {
                    CodeMirror.keyMap.vim.Esc(fecm);
                } else if (vimMode === "vim-insert" || vimMode === "vim-replace") {
                    CodeMirror.keyMap["vim-insert"].Esc(fecm);
                } else {
                    CodeMirror.commands.close(fecm);
                }
            }
        }
    }
    /**
     * Set CodeMirror KeyMap based on mode changes.
     * @param {String} map New map name.
     */
    function setVimKeyMap(map) {
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
    }
    /**
     * Change editor, possibly to inline editor.
     * @param {jQuery.Event} event Active editor change event.
     * @param {Editor} focusedEditor Currently focused editor.
     * @param {Editor} previousEditor Editor that last had focus.
     */
    // TODO: Inline editing reverts to non-vim keymap.
    function changeEditor(event, focusedEditor, previousEditor) {
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
                var feKeyMap = fecm.getOption("keyMap"),
                    preKeyMap = precm.getOption("keyMap");

                // if the keymap isn't one of Vim.js' keymap options, turn the vim on
                // and set it to the proper mode.
                if (feKeyMap !== "vim" && feKeyMap !== "vim-insert" && feKeyMap !== "vim-replace") {
                    // enable vim
                    controller.enable(focusedEditor._codeMirror);
                    // force an esc on the editor to get it to act
                    // normally after change.
                    CodeMirror.keyMap.vim.Esc(fecm);
                    // set vim option
                    setVimKeyMap(preKeyMap);
                    attachVimderbar(fecm);
                }

                if (precm.state.vim && precm.state.vim.visualMode) {
                    // previous state was "visual" so exit whatever mode currently in
                    // and set to visual
                    if (feKeyMap === "vim-insert" || feKeyMap === "vim-replace") {
                        // exit whatever mode currently in.
                        CodeMirror.keyMap["vim-insert"].Esc(fecm);
                    } else {
                        CodeMirror.keyMap.vim.Esc(fecm);
                    }

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
                    // TODO: these events are not being called
                    fecm.off("keydown", _escKeyEvent);
                    fecm.on("keydown", _escKeyEvent);
                }
            }
        }
    }

    exports.init = init;
    exports.changeDocument = changeDocument;
    exports.attachVimderbar = attachVimderbar;
});
