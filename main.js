/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/
/*global define, brackets, $, Mustache, localStorage*/

define(function (require, exports, module) {
    "use strict";

    // Brackets modules
    var AppInit = brackets.getModule("utils/AppInit");
    var CommandManager = brackets.getModule("command/CommandManager");
    var EditorManager = brackets.getModule("editor/EditorManager");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    var Menus = brackets.getModule("command/Menus");
    var PreferencesManager = brackets.getModule("preferences/PreferencesManager");
    var WorkspaceManager = brackets.getModule("view/WorkspaceManager");
    // Preferences
    var vimderbarPreferences = PreferencesManager.getExtensionPrefs("vimderbar");
    var vimderbarEnabled = vimderbarPreferences.get("enabled");
    var editorSpaces = PreferencesManager.get("spaceUnits");
    var useTabChar = PreferencesManager.get("useTabChar");
    var tabSize = PreferencesManager.get("tabSize");
    // Vimderbar
    var panelHtml = require("text!templates/bottom-panel.html");
    var VimFix = require("./src/VimFix");
    var CommandDialog = require("./src/CommandDialog");
    var TOGGLE_VIMDERBAR_ID = "view.enableVimderbar";
    var firstInit = true;
    var $vimderbar;

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
     * @param {CodeMirror} cm Current CodeMirror editor instance.
     */
    function setKeyBindings() {
        var activeEditor = EditorManager.getActiveEditor();
        if (activeEditor) {
            var cm = activeEditor._codeMirror;
            var extraKeys = vimderbarPreferences.get("extraKeys") || {};
            cm.setOption("tabSize", PreferencesManager.get("tabSize"));
            if (!PreferencesManager.get("useTabChar")) {
                cm.setOption("indentWithTabs", false);
                extraKeys.Tab = function (cm) {
                    cm.replaceSelection(getTabSpaces());
                };
                cm.setOption("extraKeys", extraKeys);
            } else {
                cm.setOption("indentWithTabs", true);
                cm.setOption("extraKeys", null);
            }
        }
    }
    /**
     * @private
     * Enable Vimderbar on current CodeMirror instance.
     * @param {CodeMirror} cm Current CodeMirror editor instance.
     */
    function enableVimderbar(cm) {
        // I know that _codeMirror is deprecated, but I couldn't get
        // this to work in any other way. Will continue to investigate.
        setKeyBindings(cm);
        cm.setOption("showCursorWhenSelecting", true);
        cm.setOption("keyMap", "vim");
        cm.setOption("vimMode", true);
    }
    /**
     * @private
     * Disable Vimderbar.
     * @param {CodeMirror} cm Current CodeMirror editor instance.
     */
    function disableVimderbar(cm) {
        cm.setOption("showCursorWhenSelecting", false);
        cm.setOption("keyMap", "default");
        cm.setOption("vimMode", false);
    }
    /**
     * @private
     * Hide or show Vimderbar on active editor window based on localStorage
     */
    function handleShowHideVimderbar($event, focusedEditor, lostEditor) {
        if (lostEditor) {
            var lostCm = lostEditor._codeMirror;
            if (lostCm) {
               VimFix.destroy(lostCm);
               disableVimderbar(lostCm);
            }
        }
        if (focusedEditor) {
            var focusedCm = focusedEditor._codeMirror;
            if (focusedCm) {
                CommandDialog.init(focusedCm);
                VimFix.init(focusedCm);
                if (vimderbarPreferences.get("enabled")) {
                    $vimderbar.show();
                    enableVimderbar(focusedCm);
                    CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(true);
                } else {
                    $vimderbar.hide();
                    disableVimderbar(focusedCm);
                    CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(false);
                }
            }
        }
        WorkspaceManager.recomputeLayout();
    }
    /**
     * Toggle Vimderbar on and off.
     */
    function toggleActive() {
        vimderbarPreferences.set("enabled", !vimderbarPreferences.get("enabled"));
        handleShowHideVimderbar({}, EditorManager.getActiveEditor());
    }
    /**
     * Initialize Vimderbar plugin; setup menu, load vim.js from CodeMirror,
     * setup css and html, hook Document change, apply VimFix, and init CommandDialog
     */
    function init() {
        // Register function as command
        CommandManager.register("Enable Vimderbar", TOGGLE_VIMDERBAR_ID, toggleActive);
        // Add command to View menu, if it exists
        var view_menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        if (view_menu) {
            view_menu.addMenuItem(TOGGLE_VIMDERBAR_ID);
        }
        PreferencesManager.on("change", setKeyBindings);
        vimderbarPreferences.on("change", handleShowHideVimderbar);
        CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(vimderbarEnabled);

        // Add the HTML UI
        ExtensionUtils.loadStyleSheet(module, "styles/vimderbar.css");
        $(".content").append(Mustache.render(panelHtml));
        // keep vimderbar off by default
        $vimderbar = $("#vimderbar");
        $vimderbar.hide();

        // import vim keymap from brackets source.
        brackets.libRequire(["thirdparty/CodeMirror2/keymap/vim"], function () {
            $(EditorManager).on("activeEditorChange", handleShowHideVimderbar);
        });
    }

    AppInit.htmlReady(function () {
        init();
    });
});
