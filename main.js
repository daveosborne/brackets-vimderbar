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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, Mustache, CodeMirror, _showVimderbar, setTimeout */

define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var CommandManager      = brackets.getModule("command/CommandManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        KeyBindingManager   = brackets.getModule("command/KeyBindingManager"),
        Menus               = brackets.getModule("command/Menus"),
        PreferencesManager  = brackets.getModule("preferences/PreferencesManager"),
        Resizer             = brackets.getModule("utils/Resizer");

    // import the CodeMirror vim keymap. Should figure out how to get it
    // from the source. The current method requires a manual update of
    // Vim.js (which has now been altered)
    var Dialog          = require("Dialog"),
        SearchCursor    = require("SearchCursor"),
        Vim             = require("Vim");

    var panelHtml           = require("text!templates/bottom-panel.html"),
        TOGGLE_VIMDERBAR_ID = "fontface.show-vimderbar.view.vimderbar",
        keyList             = [],
        loaded              = false,
        HEADER_HEIGHT       = 5,
        defaultPrefs        = { height: 5 },
        vimActive           = false;
    
    var oldKeys;
    
    CodeMirror.commands.vimSave = function (cm) {
        cm.save = CommandManager.execute("file.save");
        CommandManager.execute("file.save");
        // I'm not sure I understand why calling this twice 
        // is the only way to get the save to work. @ff.
    };
  
    CodeMirror.commands.vimClose = function (cm) {
        CommandManager.execute("file.close");
    };
    
    CodeMirror.commands.vimOpen = function (cm) {
        CommandManager.execute("file.open");
        // should it be "navigate.quickOpen"? 
        // Ran into trouble with quickOpen 
        // (auto focus into editor after ex command overrides qO). @ff. 
    };
    
    function _enableVimderbar(editor) {
        var $vimderbar = $("#vimderbar");
        // output Normal mode in 
        $vimderbar.children("#mode").text("-- Normal --");
        
        if (editor !== null) {
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
        
        var $vimderbar = $("#vimderbar");
        
        if ($vimderbar.css("display") === "none") {
            $vimderbar.show();
            CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(true);
            _enableVimderbar(activeEditor);
            vimActive = true;
        } else {
            $vimderbar.hide();
            CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(false);
            _disableVimderbar(activeEditor);
            vimActive = false;
        }
        EditorManager.resizeEditor();
    }
    
    
    function init() {
        var $vimderbarPanel,
            s,
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
        $vimderbarPanel = $("#vimderbar");
        $vimderbarPanel.hide();
        CommandManager.get(TOGGLE_VIMDERBAR_ID).setChecked(false);
    }
    
    init();
    setTimeout(function () {
        // get the default Brackets "extraKeys" so we don't overwrite the settings
        oldKeys = EditorManager.getActiveEditor()._codeMirror.getOption("extraKeys");
    }, 1000); // need to wait ~1 second before we can access getActiveEditor();
    
    // keep an eye on document changing so that the vim keyMap will apply to all files in the window
    $(DocumentManager).on("currentDocumentChange", function () {
        var activeEditor = EditorManager.getActiveEditor();
        if (vimActive === true) {
            _enableVimderbar(activeEditor);
        } else {
            _disableVimderbar(activeEditor);
        }
    });
});