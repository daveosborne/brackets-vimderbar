/*jslint vars: true, plusplus: true, nomen: true, indent: 4, maxerr: 50*/
/*global define, localStorage, $, brackets, console*/

// holds vim ex commmand history in projectFile
define(function (require, exports) {
    "use strict";

    // Brackets modules
    var ProjectManager = brackets.getModule("project/ProjectManager");
    var PreferencesManager = brackets.getModule("preferences/PreferencesManager");
    var vimderbarPreferences = PreferencesManager.getExtensionPrefs("vimderbar");
    // State
    var commandHistory;
    var historyPosition;
    var currentProject;
    var useCommonVimHistory;

    // Persistence
    /**
     * @private
     * Store current history in localStorage
     */
    function persistHistory() {
        localStorage.setItem("fontface.vimderbar.history." + currentProject, JSON.stringify(commandHistory));
    }
    /**
     * Clear commandHistory
     */
    function resetHistory() {
        commandHistory = [];
        historyPosition = -1;
        persistHistory();
    }
    /**
     * @private
     * Retrieve current history from localStorage
     */
    function fetchHistory() {
        historyPosition = -1;
        var history = localStorage.getItem("fontface.vimderbar.history." + currentProject);
        if (history) {
            try {
                commandHistory = JSON.parse(history);
            } catch (e) {
                console.error("vimderbar: history parse error", e);
                commandHistory = [];
            }
        } else {
            resetHistory();
        }
    }
    // Housekeeping
    /**
     * @private
     * Switch history to another project
     * @param {String} project Project full path, used as lookup key in localStorage
     */
    function changeProject(project) {
        if (useCommonVimHistory) {
            currentProject = "common";
        } else {
            currentProject = project;
        }
        fetchHistory();
    }
    // Status Bar Interaction
    /**
     * Add an ExCommand to history (prepend), reset history position, store history
     * @param {String} command ExCommand string to store in history
     */
    function add(command) {
        var index = $.inArray(command, commandHistory);
        if (index >= 0) {
            commandHistory.splice(index, 1);
        }
        commandHistory.unshift(command);
        historyPosition = -1;
        persistHistory();
    }
    /**
     * Get the previous ExCommand in history, move position index
     * @returns {String} ExCommand at new history position
     */
    function getPrevHistoryItem() {
        historyPosition++;
        if (historyPosition >= commandHistory.length) {
            historyPosition = commandHistory.length - 1;
        }
        return commandHistory[historyPosition];
    }
    /**
     * Get the next ExCommand in history, move position index
     * @returns {String} ExCommand at new history position
     */
    function getNextHistoryItem() {
        historyPosition--;
        if (historyPosition < 0) {
            historyPosition = 0;
        }
        return commandHistory[historyPosition];
    }
    /**
     * Reset history position (triggered on input area blur)
     */
    function exitHistory() {
        historyPosition = -1;
    }

    /**
     * Get history preferences and change project history to current project
     */
    function init() {
        ProjectManager.on("projectOpen", function () {
            changeProject(ProjectManager.getProjectRoot().fullPath);
        });
        vimderbarPreferences.on("change", function () {
            useCommonVimHistory = vimderbarPreferences.get("commonHistory");
            changeProject(ProjectManager.getProjectRoot().fullPath);
        });
    }

    exports.resetHistory = resetHistory;
    exports.add = add;
    exports.getPrevHistoryItem = getPrevHistoryItem;
    exports.getNextHistoryItem = getNextHistoryItem;
    exports.exitHistory = exitHistory;
    exports.init = init;
});
