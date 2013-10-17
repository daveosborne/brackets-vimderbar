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
        Vim,
        VimFix,
        Dialog              = require("Dialog"),
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
        $vimderbar;
    
    // import vim keymap from brackets source. once loaded, import vim fixes.
    // vim fixes are too complex at the moment. perhaps even impossible. 
    // continue manually updating vim.js for now.
    /*brackets.libRequire(["thirdparty/CodeMirror2/keymap/vim"], function (vim) {
        Vim = vim;
        VimFix = require("VimFix")(CodeMirror.Vim);
    });*/
    brackets.libRequire(["thirdparty/CodeMirror2/addon/search/searchcursor"], function (sc) {
        SearchCursor = sc;
    });
    Vim = require("Vim");
    
    CodeMirror.commands.vimSave = function (cm) {
        CommandManager.execute("file.save");
    };
  
    CodeMirror.commands.vimClose = function (cm) {
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
    
    CodeMirror.commands.vimOpen = function (cm) {
        setTimeout(function () {
			CommandManager.execute("navigate.quickOpen");
		}, 200);
        // used to be "file.open" because quickOpen would automatically close
        // following the user's push of Enter key to submit Open command (":e[Enter]")
        // setTimeout meant to give the user a moment to let go of the Enter key.
    };
    
    function _enableVimderbar(editor) {
        if (editor !== null) {
            CodeMirror.watchVimMode(editor._codeMirror);
            // I know that _codeMirror is deprecated, but I couldn't get
            // this to work in any other way. Will continue to investigate.
            editor._codeMirror.setOption("extraKeys", null);
            editor._codeMirror.setOption("showCursorWhenSelecting", true);
            editor._codeMirror.setOption("keyMap", "vim");
        }
    }
    
    function _disableVimderbar(editor) {
        if (editor !== null) {
            editor._codeMirror.setOption("extraKeys", oldKeys);
            editor._codeMirror.setOption("showCursorWhenSelecting", false);
            editor._codeMirror.setOption("keyMap", "default");
        }
    }
    
    function _handleShowHideVimderbar() {
        var activeEditor = EditorManager.getActiveEditor();

        if (vimActive === false) {
            // turn vim on
            $vimderbar.show();
            CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(true);
            CodeMirror.updateVimDialog("Normal");
            _enableVimderbar(activeEditor);
            vimActive = true;
            localStorage.vimderbarOn = true;
            VimFix = require("VimFix")(EditorManager,
                                       {enable: _enableVimderbar,
                                        disable: _disableVimderbar},
                                        DocumentManager);
        } else {
            // turn vim off
            $vimderbar.hide();
            CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(false);
            _disableVimderbar(activeEditor);
            vimActive = false;
            localStorage.vimderbarOn = false;
            $(EditorManager).trigger({type: "vimderbarDisabled"});
        }
        EditorManager.resizeEditor();
    }
    
    
    function init() {
        var s,
            view_menu;
        
        ExtensionUtils.loadStyleSheet(module, "vimderbar.css");
        // Register function as command
        CommandManager.register("Enable Vimderbar", TOGGLE_VIMDERBAR_ID,
                                _handleShowHideVimderbar);
        // Add command to View menu, if it exists
        view_menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
        if (view_menu) {
            view_menu.addMenuItem(TOGGLE_VIMDERBAR_ID);
        }
        // Add the HTML UI
        s = Mustache.render(panelHtml);
        $(".content").append(s);
        // keep vimderbar off by default
        $vimderbar = $("#vimderbar");
        $vimderbar.hide();
        CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(false);

        Dialog.init();
    }
    
    AppInit.htmlReady(function () {
        init();
    });
    
    AppInit.appReady(function () {
        oldKeys = EditorManager.getActiveEditor()._codeMirror.getOption("extraKeys");
                
        if (localStorage.vimderbarOn === "true") {
            _handleShowHideVimderbar();
        }
    });
    
    // keep an eye on document changing so that the vim keyMap will apply to all files in the window
    $(DocumentManager).on("currentDocumentChange", function () {
        var activeEditor = EditorManager.getActiveEditor();
        if (vimActive === true) {
            CodeMirror.updateVimDialog("Normal");
            _enableVimderbar(activeEditor);
        } else {
            _disableVimderbar(activeEditor);
        }
    });
});
