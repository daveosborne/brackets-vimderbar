/*jslint vars: true, plusplus: true, nomen: true, indent: 4, maxerr: 50*/
/*global define, brackets, $, Mustache, localStorage, setTimeout*/

define(function (require, exports, module) {
    "use strict";

    // Brackets modules
    var AppInit = brackets.getModule("utils/AppInit");
    var CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror");
    var Commands = brackets.getModule("command/Commands");
    var CommandManager = brackets.getModule("command/CommandManager");
    var EditorManager = brackets.getModule("editor/EditorManager");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    var MainViewManager = brackets.getModule("view/MainViewManager");
    var Menus = brackets.getModule("command/Menus");
    var PreferencesManager = brackets.getModule("preferences/PreferencesManager");
    var WorkspaceManager = brackets.getModule("view/WorkspaceManager");
    var KeyBindingManager = brackets.getModule("command/KeyBindingManager");
    // Local modules
    var StatusBar = require("./src/StatusBar");
    // Preferences
    var vimderbarPreferences = PreferencesManager.getExtensionPrefs("vimderbar");
    // Constants
    var TOGGLE_VIMDERBAR_ID = "view.enableVimderbar";
    var TOGGLE_ACTIVE_PANE = "view.toggleActivePane";

    /**
     * @private
     * Return tab string based on preferences
     */
    function getTabSpaces() {
        var i, spaces = "";
        for (i = 0; i < PreferencesManager.get("spaceUnits"); i++) {
            spaces += " ";
        }
        return spaces;
    }
    /**
     * @private
     * Set CodeMirror options regarding tabs based on current preferences
     * @param {CodeMirror} cm Current CodeMirror editor instance
     */
    function setKeyBindings(cm) {
        cm.setOption("tabSize", PreferencesManager.get("tabSize"));
        if (!PreferencesManager.get("useTabChar")) {
            cm.setOption("indentWithTabs", false);
            var extraKeys = {
                Tab: function (cm) {
                    cm.replaceSelection(getTabSpaces());
                }
            };
            cm.setOption("extraKeys", extraKeys);
        } else {
            cm.setOption("indentWithTabs", true);
            cm.setOption("extraKeys", null);
        }
    }
    /**
     * @private
     * Close inline editor when esc is pressed outside of insert/replace mode
     * @param {CodeMirror} _cm Event CodeMirror instance
     * @param {jQuery.Event} e KeyEvent event object
     */
    function escKeyEvent(cm, e) {
        if (e.keyCode === 27) {
            e.stopPropagation();
            var inlineFocused = EditorManager.getFocusedInlineWidget();
            if (inlineFocused) {
                if (cm.state.vim && !cm.state.vim.insertMode && !cm.state.vim.visualMode) {
                    CodeMirror.commands.close();
                }
            }
        }
    }
    /**
     * @private
     * Enable Vimderbar on current CodeMirror instance
     * @param {CodeMirror} cm Current CodeMirror editor instance
     */
    function enableVimderbar(cm) {
        cm.on("keydown", escKeyEvent);
        setKeyBindings(cm);
        cm.setOption("showCursorWhenSelecting", true);
        cm.setOption("keyMap", "vim");
        cm.setOption("vimMode", true);
        $("#vimderbar").show();
        WorkspaceManager.recomputeLayout();
    }
    /**
     * @private
     * Disable Vimderbar
     * @param {CodeMirror} cm Current CodeMirror editor instance
     */
    function disableVimderbar(cm) {
        cm.off("keydown", escKeyEvent);
        cm.setOption("showCursorWhenSelecting", false);
        cm.setOption("keyMap", "default");
        cm.setOption("vimMode", false);
        $("#vimderbar").hide();
    }
    /**
     * @private
     * Enable or disable Vimderbar on active editor window based on localStorage
     */
    function handleEditorChange(e, focused, lostFocus) {
        if (lostFocus) {
            disableVimderbar(lostFocus._codeMirror);
        }
        if (vimderbarPreferences.get("enabled") && focused) {
            enableVimderbar(focused._codeMirror);
        }
    }
    /**
     * @private
     * Enable or disable Vimderbar based on preferences
     */
    function preferencesChange() {
        var active = EditorManager.getActiveEditor();
        if (active) {
            var cm = active._codeMirror;
            if (vimderbarPreferences.get("enabled")) {
                enableVimderbar(cm);
                CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(true);
            } else {
                disableVimderbar(cm);
                CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(false);
            }
        }
    }
    /**
     * Toggle Vimderbar on and off
     */
    function toggleActive() {
        vimderbarPreferences.set("enabled", !vimderbarPreferences.get("enabled"));
    }
    /**
     * Set up CodeMirror Ex commands
     */
    function setExCommands() {
        // CodeMirror -> Brackets Command Hooks
        CodeMirror.commands.save = function () {
            CommandManager.execute("file.save");
        };
        CodeMirror.commands.close = function () {
            var hostEditor = EditorManager.getCurrentFullEditor();
            var inlineFocused = EditorManager.getFocusedInlineWidget();
            if (inlineFocused) {
                // inline editor exists & is in focus. close it
                EditorManager.closeInlineWidget(hostEditor, inlineFocused);
            } else {
                // no inline editor is in focus so just close the document
                CommandManager.execute("file.close");
            }
        };
        CodeMirror.commands.open = function () {
            // used to be "file.open" because quickOpen would automatically close
            // following the user's push of Enter key to submit Open command (":e[Enter]")
            // setTimeout meant to give the user a moment to let go of the Enter key
            setTimeout(function () {
                CommandManager.execute("navigate.quickOpen");
            }, 150);
        };

        // Ex Command Definitions
        CodeMirror.Vim.defineEx("quit", "q", function (cm) {
            MainViewManager.focusActivePane();
            CodeMirror.commands.close(cm);
        });
        CodeMirror.Vim.defineEx("edit", "e", function (cm) {
            CodeMirror.commands.open();
        });
        CodeMirror.Vim.defineEx("write", "w", function (cm) {
            CodeMirror.commands.save(cm);
        });
        CodeMirror.Vim.defineEx("bnext", "bn", function (cm) {
            CommandManager.execute(Commands.CMD_OPEN, { fullPath: MainViewManager.traverseToNextViewByMRU(1).file._path });
        });
        CodeMirror.Vim.defineEx("bprev", "bp", function (cm) {
            CommandManager.execute(Commands.CMD_OPEN, { fullPath: MainViewManager.traverseToNextViewByMRU(-1).file._path });
        });
        CodeMirror.Vim.defineEx("vsplit", "vs", function (cm) {
            CommandManager.execute(Commands.CMD_SPLITVIEW_VERTICAL);
        });
        CodeMirror.Vim.defineEx("split", "sp", function (cm) {
            CommandManager.execute(Commands.CMD_SPLITVIEW_HORIZONTAL);
        });
        CodeMirror.Vim.defineEx("only", "on", function (cm) {
            CommandManager.execute(Commands.CMD_SPLITVIEW_NONE);
        });
    }

    /**
     * Initialize Vimderbar plugin; setup menu, load vim.js from CodeMirror,
     * setup css and html, hook Document change, init StatusBar
     */
    function init() {
        // Register function as command
        CommandManager.register("Enable Vimderbar", TOGGLE_VIMDERBAR_ID, toggleActive);
        // Switch active pane
        CommandManager.register("Switch Pane", TOGGLE_ACTIVE_PANE, function () {
            var activePaneId = MainViewManager.getActivePaneId();
            var paneIdList = MainViewManager.getPaneIdList();
            var found = paneIdList.indexOf(activePaneId);
            MainViewManager.setActivePaneId(paneIdList[paneIdList.length - 1 - found]);
        });
        // Add command to View menu, if it exists
        var view_menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        if (view_menu) {
            view_menu.addMenuItem(TOGGLE_VIMDERBAR_ID);
        }
        vimderbarPreferences.on("change", preferencesChange);
        CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(vimderbarPreferences.get("enabled"));
        ExtensionUtils.loadStyleSheet(module, "styles/vimderbar.css");

        StatusBar.init();
        EditorManager.on("activeEditorChange", handleEditorChange);

        // Import vim keymap mode from brackets source
        brackets.libRequire(["thirdparty/CodeMirror2/keymap/vim"], function () {
            var mappings = vimderbarPreferences.get("mappings") || [];
            if (mappings) {
                for (var i = 0; i < mappings.length; i++) {
                    CodeMirror.Vim.map(mappings[i].keys, mappings[i].toKeys, mappings[i].mode);
                }
            }
            setExCommands();
        });
    }

    AppInit.htmlReady(function () {
        init();
    });
    AppInit.appReady(function () {
        preferencesChange();
    });
});
