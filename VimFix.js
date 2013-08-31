/*jslint devel: true, nomen: true, indent: 4 */
/*global define, $, CodeMirror, brackets */

// this function's purpose is to make CodeMirror's vim keymap play nice with
// Brackets.
define(function () {
    "use strict";
    var VimFix;
    VimFix = function (editorManager, controller, documentManager) {
        var escKeyEvent,
            changeEditor,
            fecm,
            precm,
            feKeyMap,
            preKeyMap,
            lastFocusedTimeStamp,
            lastTimeStamp,
            setVimKeyMap,
            vimMode;

        // todo:
        // 1. fix insert cursor in inline editors. 
        //    (open inline editor in normal mode. press i from within the inline editor.
        //     notice that the cursor remains "fat".) 
        //    fixing this bug will likely fix the visual mode bug described below.
        // 2. it feels like lag accumulates with each ":w" save. look into this.

        /**
        ** solve the inline-editor dilemma
        **/
        escKeyEvent = function (jqevent, ed, event) {
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

        setVimKeyMap = function (map) {
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
            CodeMirror.signal(fecm, "vim-mode-change", {mode: mode});
        };

        changeEditor = function (event, focusedEditor, previousEditor) {
            if (focusedEditor && previousEditor) {
                // make sure focusedEditor and previousEditor exist.
                // this check is to make sure no errors are thrown when
                // a file is opened.

                // get editors so we don't waste resources when user swaps between
                // documents. Only watch if the focused editor is an inline editor
                // or if the focused editor contains inline editors.
                var currentFullEditor = editorManager.getCurrentFullEditor(),
                    inlineEditors = currentFullEditor.getInlineWidgets();
                // ._visibleRange still the only reliable way to detect whether an
                // editor is inline or not. I'm having a hard time thinking of another
                // way to do this.
                if (focusedEditor._visibleRange || inlineEditors.length !== 0) {
                    fecm = focusedEditor._codeMirror;
                    precm = previousEditor._codeMirror;
                    feKeyMap = fecm.getOption("keyMap");
                    preKeyMap = precm.getOption("keyMap");
                    
                    // if the keymap isn't one of Vim.js' keymap options, turn the vim on
                    // and set it to the proper mode.
                    if (feKeyMap !== "vim" && feKeyMap !== "vim-insert"
                            && feKeyMap !== "vim-replace") {
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
                        $(focusedEditor).off("keyEvent", escKeyEvent);
                        $(focusedEditor).on("keyEvent", escKeyEvent);
                    }
                }
            }
        };

        // init inline editor fix
        $(editorManager).on("activeEditorChange", changeEditor);
        // add event listener in case user decides to disable vimderbar.
        $(editorManager).on("vimderbarDisabled", function () {
            $(editorManager).off("activeEditorChange", changeEditor);
        });

        /**
        ** todo: port Vim.js manual fixes over to this file
        ** & import vim.js from brackets source.
        **/
        CodeMirror.Vim.defineEx("quit", "q", function (cm) {
            cm.focus();
            CodeMirror.commands.vimClose(cm);
        });

        CodeMirror.Vim.defineEx("edit", "e", function (cm) {
            CodeMirror.commands.vimOpen(cm);
        });

        CodeMirror.Vim.defineEx("write", "w", function (cm) {
            CodeMirror.commands.vimSave(cm);
        });

        // Doesn't work. save gets called and completes but close fires too soon
        // and asks if i want to save before closing. fix later.
//        CodeMirror.Vim.defineEx("x", "x", function (cm) {
//            CodeMirror.commands.vimSave(cm);
//            CodeMirror.commands.vimClose(cm);
//        });
    };
    return VimFix;
});
