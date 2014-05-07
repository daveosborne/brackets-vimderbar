/* 
 * Permission is hereby granted, free of charge, to any person 
 * obtaining a copy of this software and associated documentation 
 * files (the "Software"), to deal in the Software without 
 * restriction, including without limitation the rights to use, copy, 
 * modify, merge, publish, distribute, sublicense, and/or sell copies 
 * of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be 
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES 
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY 
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE 
 * OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 */

/*jslint plusplus: true, devel: true, nomen: true, indent: 4, browser: true, maxerr: 50 */
/*global define, brackets, $, jQuery, Mustache, CodeMirror, localStorage */

define(function (require, exports, module) {
    "use strict";
    // Brackets modules
    var CommandManager      = brackets.getModule("command/CommandManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        Menus               = brackets.getModule("command/Menus"),
        AppInit             = brackets.getModule("utils/AppInit"),
        CodeMirror          = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
        Dialog              = require("./Dialog"),
        VimFix              = require('./VimFix'),
        SearchCursor,
        panelHtml           = require("text!templates/bottom-panel.html"),
        TOGGLE_VIMDERBAR_ID = "fontface.show-vimderbar.view.vimderbar",
        VIMDERBAR_PREFS_ID  = "fontface.show-vimderbar.prefs",
        keyList             = [],
        loaded              = false,
        HEADER_HEIGHT       = 5,
        defaultPrefs        = { height: 5 },
        vimActive           = false,
        oldKeys,
        cm,
        $vimderbar;

    // import vim keymap from brackets source.
    brackets.libRequire(["thirdparty/CodeMirror2/keymap/vim"], function (vim) {
        ExtensionUtils.loadStyleSheet(module, "vimderbar.css");
        // Add the HTML UI
        $(".content").append(Mustache.render(panelHtml));
        // keep vimderbar off by default
        $vimderbar = $("#vimderbar");
        $vimderbar.hide();
    });

    brackets.libRequire(["thirdparty/CodeMirror2/addon/search/searchcursor"], function (sc) {
        SearchCursor = sc;
    });

    function _enableVimderbar(cm) {
        if (cm !== null) {
            CodeMirror.watchVimMode(cm._codeMirror);
            // I know that _codeMirror is deprecated, but I couldn't get
            // this to work in any other way. Will continue to investigate.
            cm.setOption("extraKeys", null);
            cm.setOption("showCursorWhenSelecting", true);
            cm.setOption("keyMap", "vim");
        }
    }

    function _disableVimderbar(cm) {
        if (cm !== null) {
            cm.setOption("extraKeys", oldKeys);
            cm.setOption("showCursorWhenSelecting", false);
            cm.setOption("keyMap", "default");
        }
    }

    function showVimderbar(cm) {
        console.log("show vimderbar");
        // turn vim on
        $vimderbar.show();
        CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(true);
        VimFix.changeDoc(cm);
        Dialog.changeDoc(cm);
        cm.updateVimDialog("Normal");
        _enableVimderbar(cm);
        vimActive = true;
        localStorage.setItem("vimderbarOn", true);
    }

    function hideVimderbar(cm) {
        console.log("hide vimderbar");
        // turn vim off
        $vimderbar.hide();
        CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(false);
        _disableVimderbar(cm);
        vimActive = false;
        localStorage.setItem("vimderbarOn", false);
        $(EditorManager).trigger({type: "vimderbarDisabled"});
    }

    function _handleShowHideVimderbar() {
        console.log("handleShowHide");
        var activeEditor = EditorManager.getActiveEditor();
        if (activeEditor) {
            console.log("handleShowHide activeEditor");
            var cm = activeEditor._codeMirror;
            if (localStorage.getItem("vimderbarOn") === "true") {
                showVimderbar(cm);
            } else {
                hideVimderbar(cm);
            }
            EditorManager.resizeEditor();
        }
    }

    function toggleActive() {
        if (localStorage.getItem("vimderbarOn") === "true") {
            localStorage.setItem("vimderbarOn", false);
        } else {
            localStorage.setItem("vimderbarOn", true);
        }
        _handleShowHideVimderbar();
    }

    function init() {
        var cm = EditorManager.getActiveEditor()._codeMirror;
        Dialog.init(cm);
        VimFix.init(cm, {
            enable: _enableVimderbar,
            disable: _disableVimderbar
        });
        if (localStorage.getItem('vimderbarOn') === "true") {
            console.log("init set vimActive");
            _handleShowHideVimderbar();
            CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(true);
        }
    }

    AppInit.htmlReady(function () {
        // Register function as command
        CommandManager.register("Enable Vimderbar", TOGGLE_VIMDERBAR_ID, toggleActive);
        // Add command to View menu, if it exists
        var view_menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        if (view_menu) {
            view_menu.addMenuItem(TOGGLE_VIMDERBAR_ID);
        }

        CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(false);
    });
    
    AppInit.appReady(function () {
        init();
        oldKeys = EditorManager.getActiveEditor()._codeMirror.getOption("extraKeys");
    });
    
    // keep an eye on document changing so that the vim keyMap will apply to all files in the window
    $(DocumentManager).on("currentDocumentChange", _handleShowHideVimderbar);
});

