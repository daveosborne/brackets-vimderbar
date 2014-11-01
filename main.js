/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50*/
/*global define, brackets, $, Mustache, localStorage*/

define(function (require, exports, module) {
    "use strict";
    // Brackets modules
    var AppInit = brackets.getModule("utils/AppInit"),
        CommandManager = brackets.getModule("command/CommandManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        Menus = brackets.getModule("command/Menus"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        WorkspaceManager = brackets.getModule("view/WorkspaceManager"),
        // Preferences
        vimderbarPreferences = PreferencesManager.getExtensionPrefs("vimderbar"),
        vimderbarEnabled = vimderbarPreferences.get("enabled"),
        editorSpaces = PreferencesManager.get("spaceUnits"),
        useTabChar = PreferencesManager.get("useTabChar"),
        tabSize = PreferencesManager.get("tabSize"),
        // Vimderbar
        panelHtml = require("text!templates/bottom-panel.html"),
        VimFix = require('./src/VimFix'),
        CommandDialog = require("./src/CommandDialog"),
        TOGGLE_VIMDERBAR_ID = "fontface.show-vimderbar.view.vimderbar",
        firstInit = true,
        $vimderbar;

    /**     
     * @private
     * Set CodeMirror options regarding tabs based on current preferences
     * @param {CodeMirror} cm Current CodeMirror editor instance.
     */
    function _setKeyBindings(cm) {
        var extraKeys = vimderbarPreferences.get("extraKeys") || {};
        cm.setOption("tabSize", PreferencesManager.get("tabSize"));
        if (!PreferencesManager.get("useTabChar")) {
            cm.setOption("indentWithTabs", false);
            extraKeys.Tab = function (cm) {
                var spaces = "";
                var i;
                var numSpaces = PreferencesManager.get("spaceUnits");
                for (i = 0; i < numSpaces; i++) {
                    spaces += " ";
                }
                cm.replaceSelection(spaces);
            };
            cm.setOption("extraKeys", extraKeys);
        } else {
            cm.setOption("indentWithTabs", true);
            cm.setOption("extraKeys", null);
        }
    }

    /**
     * @private
     * Set CodeMirror options to enable Vim.
     * @param {CodeMirror} cm Current CodeMirror editor instance.
     */
    function _enableVimderbar(cm) {
        // I know that _codeMirror is deprecated, but I couldn't get
        // this to work in any other way. Will continue to investigate.
        _setKeyBindings(cm);
        cm.setOption("showCursorWhenSelecting", true);
        cm.setOption("keyMap", "vim");
    }
    /**
     * @private
     * Set CodeMirror options back to default.
     * @param {CodeMirror} cm Current CodeMirror editor instance.
     */
    function _disableVimderbar(cm) {
        cm.setOption("extraKeys", null);
        cm.setOption("showCursorWhenSelecting", false);
        cm.setOption("keyMap", "default");
    }
    /**
     * @private
     * Show Vimderbar status, enable Vimderbar on current CodeMirror instance.
     * @param {CodeMirror} cm Current CodeMirror editor instance.
     */
    function _showVimderbar(cm) {
        $vimderbar.show();
        VimFix.changeDocument(cm);
        CommandDialog.changeDocument(cm);
        cm.updateVimStatus("Normal");
        _enableVimderbar(cm);
    }
    /**
     * @private
     * Hide Vimderbar status, disable Vimderbar.
     * @param {CodeMirror} cm Current CodeMirror editor instance.
     */
    function _hideVimderbar(cm) {
        $vimderbar.hide();
        _disableVimderbar(cm);
        $(EditorManager).trigger({
            type: "vimderbarDisabled"
        });
    }
    /**
     * @private
     * Hide or show Vimderbar on active editor window based on localStorage
     */
    function _handleShowHideVimderbar() {
        var activeEditor = EditorManager.getActiveEditor();
        if (activeEditor) {
            var cm = activeEditor._codeMirror;
            if (cm) {
                CommandDialog.init(cm);
                VimFix.init(cm, CommandDialog, {
                    enable: _enableVimderbar,
                    disable: _disableVimderbar
                });
                if (vimderbarPreferences.get("enabled")) {
                    _showVimderbar(cm);
                    CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(true);
                } else {
                    _hideVimderbar(cm);
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
        _handleShowHideVimderbar();
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
        PreferencesManager.on("change", function () {
            var activeEditor = EditorManager.getActiveEditor();
            if (activeEditor) {
                var cm = activeEditor._codeMirror;
                _setKeyBindings(cm);
            }
        });
        vimderbarPreferences.on("change", function () {
            _handleShowHideVimderbar();
        });
        CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(vimderbarEnabled);

        // Add the HTML UI
        ExtensionUtils.loadStyleSheet(module, "styles/vimderbar.css");
        $(".content").append(Mustache.render(panelHtml));
        // keep vimderbar off by default
        $vimderbar = $("#vimderbar");
        $vimderbar.hide();

        // import vim keymap from brackets source.
        brackets.libRequire(["thirdparty/CodeMirror2/keymap/vim"], function () {
            $(EditorManager).on("activeEditorChange", _handleShowHideVimderbar);
            $(EditorManager).one("activeEditorChange", function () {
                _handleShowHideVimderbar();
            });
        });

    }

    AppInit.htmlReady(function () {
        init();
    });

});